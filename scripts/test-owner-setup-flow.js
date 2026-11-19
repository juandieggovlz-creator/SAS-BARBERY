/**
 * BarberOS — Test Automatizado del Flujo /setup/owner
 */

const crypto = require('crypto');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const SETUP_SECRET = process.env.OWNER_SETUP_SECRET || 'bff2d7f36435353e73e054a468da453ac04502447f1bad92';
const TARGET_EMAIL = 'juandieggovlz@gmail.com';
const TEST_PASSWORD = 'RootOwner#2026$BarberOS!';

// Base32 & TOTP Generator
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Decode(base32) {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) throw new Error(`Invalid Base32 char: ${clean[i]}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTotp(secretBase32) {
  const key = base32Decode(secretBase32);
  const step = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(step), 0);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buf);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binary % 1000000).toString().padStart(6, '0');
}

async function runTest() {
  console.log('\n======================================================');
  console.log('   PRUEBA END-TO-END DEL FLUJO /setup/owner');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;
  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // 1. Estado inicial
  console.log('--- 1. Consulta de disponibilidad de setup ---');
  const resStatus = await fetch(`${BASE_URL}/api/setup/owner/status`);
  const dataStatus = await resStatus.json();
  assert(resStatus.status === 200, 'Endpoint /api/setup/owner/status responde 200');
  assert(dataStatus.setupAvailable === true, 'Inicialización reportada como DISPONIBLE');
  assert(dataStatus.targetEmail === TARGET_EMAIL, `Correo autorizado: ${TARGET_EMAIL}`);

  // 2. Verificación de Secreto
  console.log('\n--- 2. Autorización mediante Secreto de Servidor ---');
  const resBadSecret = await fetch(`${BASE_URL}/api/setup/owner/verify-secret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: 'secreto_invalido' })
  });
  assert(resBadSecret.status === 401, 'Rechaza secreto incorrecto con 401');

  const resGoodSecret = await fetch(`${BASE_URL}/api/setup/owner/verify-secret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SETUP_SECRET })
  });
  const dataGoodSecret = await resGoodSecret.json();
  assert(resGoodSecret.status === 200, 'Acepta secreto válido con 200');
  assert(!!dataGoodSecret.setupToken, 'Token firmado temporal emitido');

  const setupToken = dataGoodSecret.setupToken;

  // 3. Generación de MFA y Códigos de Recuperación
  console.log('\n--- 3. Generación de Credenciales y Segundo Factor ---');
  // Prueba con correo no autorizado
  const resBadEmail = await fetch(`${BASE_URL}/api/setup/owner/generate-mfa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setupToken, email: 'hacker@malicioso.com', password: TEST_PASSWORD })
  });
  assert(resBadEmail.status === 403, 'Bloquea intentos con correos no autorizados (403)');

  // Prueba con correo válido y contraseña segura
  const resGoodMfa = await fetch(`${BASE_URL}/api/setup/owner/generate-mfa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setupToken, email: TARGET_EMAIL, password: TEST_PASSWORD })
  });
  const dataGoodMfa = await resGoodMfa.json();
  assert(resGoodMfa.status === 200, 'Genera configuración de seguridad exitosamente (200)');
  assert(dataGoodMfa.qrCodeDataUrl?.startsWith('data:image/png;base64,'), 'Código QR Data URL generado');
  assert(typeof dataGoodMfa.totpSecretBase32 === 'string', 'Secreto TOTP Base32 emitido');
  assert(Array.isArray(dataGoodMfa.recoveryCodes) && dataGoodMfa.recoveryCodes.length === 8, '8 códigos de recuperación generados');
  assert(!!dataGoodMfa.mfaSetupToken, 'Token de sesión de setup emitido');

  const { totpSecretBase32, mfaSetupToken } = dataGoodMfa;

  // 4. Activación Final con TOTP
  console.log('\n--- 4. Verificación de Segundo Factor y Activación ---');
  // Código incorrecto
  const resBadCode = await fetch(`${BASE_URL}/api/setup/owner/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mfaSetupToken,
      totpCode: '000000',
      recoveryCodesConfirmed: true
    })
  });
  assert(resBadCode.status === 400, 'Rechaza código TOTP incorrecto con 400');

  // Sin confirmación de códigos
  const validTotp = generateTotp(totpSecretBase32);
  const resNoConfirm = await fetch(`${BASE_URL}/api/setup/owner/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mfaSetupToken,
      totpCode: validTotp,
      recoveryCodesConfirmed: false
    })
  });
  assert(resNoConfirm.status === 400, 'Exige confirmación de códigos de recuperación');

  // Completar con datos válidos
  const resComplete = await fetch(`${BASE_URL}/api/setup/owner/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mfaSetupToken,
      totpCode: validTotp,
      recoveryCodesConfirmed: true
    })
  });
  const dataComplete = await resComplete.json();
  assert(resComplete.status === 200, 'Activación final retorna 200 OK');
  assert(dataComplete.success === true, 'Inicialización completada exitosamente');
  assert(dataComplete.redirect === '/superadmin/dashboard', 'Redirección apunta a /superadmin/dashboard');

  // 5. Bloqueo de Segunda Inicialización (One-Time Setup)
  console.log('\n--- 5. Bloqueo Permanente de Segunda Inicialización ---');
  const resPostStatus = await fetch(`${BASE_URL}/api/setup/owner/status`);
  const dataPostStatus = await resPostStatus.json();
  assert(dataPostStatus.setupAvailable === false, 'Ruta /setup/owner BLOQUEADA permanentemente (setupAvailable: false)');

  const resTryAgain = await fetch(`${BASE_URL}/api/setup/owner/verify-secret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SETUP_SECRET })
  });
  assert(resTryAgain.status === 403, 'Intento de reinicialización rechazado con 403 Forbidden');

  // 6. Verificar que cuentas legacy quedaron desactivadas
  console.log('\n--- 6. Verificación de Cuentas Anteriores Desactivadas ---');
  const resLoginOld = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@barberos.com', password: 'AnyPassword123!' })
  });
  const dataLoginOld = await resLoginOld.json();
  assert(dataLoginOld.error?.includes('desactivada'), 'Cuenta legacy superadmin@barberos.com reportada como desactivada');

  const resLoginOld2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@barberos.co', password: 'AnyPassword123!' })
  });
  const dataLoginOld2 = await resLoginOld2.json();
  assert(dataLoginOld2.error?.includes('desactivada'), 'Cuenta legacy admin@barberos.co reportada como desactivada');

  console.log('\n======================================================');
  console.log(`   RESULTADO: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTest().catch((e) => {
  console.error('Error fatal durante la prueba:', e);
  process.exit(1);
});

