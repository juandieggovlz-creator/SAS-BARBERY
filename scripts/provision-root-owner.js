/**
 * BarberOS — Aprovisionamiento Seguro de Root Platform Owner
 * 
 * Uso:
 *   node scripts/provision-root-owner.js --password="TuPasswordSeguro123!"
 *   O bien con la variable de entorno ROOT_OWNER_PASSWORD
 * 
 * Garantiza:
 * 1. Asignación del rol ROOT_PLATFORM_OWNER a juandieggovlz@gmail.com.
 * 2. Hash con bcrypt de 12 rondas.
 * 3. Secreto TOTP de 20 bytes cifrado en reposo con AES-256-GCM.
 * 4. Generación e inserción de 8 códigos de recuperación de un solo uso (hasheados con bcrypt).
 * 5. Generación de URI otpauth y código QR para Google Authenticator / Microsoft Authenticator.
 * 6. NO toca ni elimina las cuentas legacy hasta que el propietario esté verificado.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const qrcode = require('qrcode');
const readline = require('readline');
require('dotenv').config();

const prisma = new PrismaClient();
const TARGET_EMAIL = 'juandieggovlz@gmail.com';

// AES-256-GCM Encrypt Helper (compatible con lib/crypto.ts)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getDerivedKey() {
  const secret = process.env.JWT_SECRET || 'barberos_fallback_key_32_bytes_len_secure';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptData(plaintext) {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
}

// Base32 Encode Helper (compatible con lib/totp.ts)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function generateTotpSecret(bytes = 20) {
  return base32Encode(crypto.randomBytes(bytes));
}

// Recovery Codes Generator
async function generateRecoveryCodes(count = 8) {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `${p1}-${p2}`;
    plainCodes.push(code);

    const hash = await bcrypt.hash(code, 10);
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

async function promptPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Introduce la contraseña para el Root Platform Owner (juandieggovlz@gmail.com): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log('   BARBEROS — APROVISIONAMIENTO DE ROOT PLATFORM OWNER');
  console.log('======================================================\n');

  let password = process.env.ROOT_OWNER_PASSWORD;

  const argPass = process.argv.find(a => a.startsWith('--password='));
  if (argPass) {
    password = argPass.split('=')[1];
  }

  if (!password) {
    if (process.stdin.isTTY) {
      password = await promptPassword();
    }
  }

  if (!password) {
    // Generar una contraseña temporal de alta entropía (20 caracteres seguros)
    const randomEntropy = crypto.randomBytes(12).toString('base64url');
    password = `Root#${randomEntropy}$9`;
    console.log('⚡ Contraseña segura generada automáticamente para la primera sesión.');
  }

  console.log(`\n⏳ Aprovisionando cuenta principal: ${TARGET_EMAIL}...`);

  // 1. Hash de contraseña
  const passwordHash = await bcrypt.hash(password, 12);

  // 2. Generar secreto TOTP
  const totpSecret = generateTotpSecret(20);
  const encryptedTotpSecret = encryptData(totpSecret);

  // 3. Generar Códigos de Recuperación
  const { plainCodes, hashedCodes } = await generateRecoveryCodes(8);

  // 4. Buscar o Crear Usuario
  const existing = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL }
  });

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { email: TARGET_EMAIL },
      data: {
        role: 'ROOT_PLATFORM_OWNER',
        password: passwordHash,
        isActive: true,
        mfaEnabled: true,
        mfaSecret: encryptedTotpSecret,
        mfaConfirmedAt: new Date(),
        lastMfaUsedAt: null
      }
    });
    console.log(`✅ Usuario existente actualizado a ROOT_PLATFORM_OWNER (ID: ${user.id})`);
  } else {
    user = await prisma.user.create({
      data: {
        email: TARGET_EMAIL,
        name: 'Juan Diego (Platform Owner)',
        role: 'ROOT_PLATFORM_OWNER',
        password: passwordHash,
        isActive: true,
        mfaEnabled: true,
        mfaSecret: encryptedTotpSecret,
        mfaConfirmedAt: new Date(),
        lastMfaUsedAt: null
      }
    });
    console.log(`✅ Nuevo usuario creado como ROOT_PLATFORM_OWNER (ID: ${user.id})`);
  }

  // 5. Almacenar Códigos de Recuperación
  await prisma.recoveryCode.deleteMany({
    where: { userId: user.id }
  });

  for (const hash of hashedCodes) {
    await prisma.recoveryCode.create({
      data: {
        userId: user.id,
        codeHash: hash
      }
    });
  }
  console.log(`✅ 8 códigos de recuperación de un solo uso generados y asegurados.`);

  // 6. Generar URI de autenticador
  const totpUri = `otpauth://totp/BarberOS:${encodeURIComponent(TARGET_EMAIL)}?secret=${totpSecret}&issuer=BarberOS&algorithm=SHA1&digits=6&period=30`;

  // 7. Generar QR Code en formato ASCII para la terminal
  const qrAscii = await qrcode.toString(totpUri, { type: 'terminal', small: true });

  console.log('\n======================================================');
  console.log('       CREDENCIALES Y CONFIGURACIÓN MFA DEL PROPIETARIO');
  console.log('======================================================\n');
  console.log(`📧 Correo: ${TARGET_EMAIL}`);
  console.log(`🔑 Rol: ROOT_PLATFORM_OWNER`);
  console.log(`🔒 Contraseña configurada: ${password}`);
  console.log(`🛡️ Estado MFA: HABILITADO Y OBLIGATORIO\n`);

  console.log('📱 ESCANEA ESTE CÓDIGO QR EN TU APP AUTENTICADORA:');
  console.log('(Google Authenticator, Microsoft Authenticator, 1Password, Authy)');
  console.log(qrAscii);

  console.log('\nO si prefieres ingresarlo manualmente:');
  console.log(`Clave Secreta Base32: ${totpSecret}`);
  console.log(`URI TOTP: ${totpUri}\n`);

  console.log('------------------------------------------------------');
  console.log('       CÓDIGOS DE RECUPERACIÓN DE UN SOLO USO');
  console.log('------------------------------------------------------');
  console.log('Guarda estos 8 códigos en tu gestor de contraseñas.');
  console.log('Cada uno solo puede utilizarse una única vez si pierdes tu app:\n');
  plainCodes.forEach((code, idx) => {
    console.log(`   [${idx + 1}]  ${code}`);
  });
  console.log('\n======================================================\n');

  // Registrar auditoría
  try {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ROOT_PLATFORM_OWNER_PROVISIONED',
        details: 'Cuenta principal de Root Platform Owner aprovisionada con MFA TOTP y 8 recovery codes.',
        ipAddress: '127.0.0.1'
      }
    });
  } catch (err) {
    // Si la tabla no tiene los campos opcionales, ignorar
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en aprovisionamiento:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
