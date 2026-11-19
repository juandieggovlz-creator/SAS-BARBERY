/**
 * BarberOS — Suite de Pruebas de Seguridad End-to-End
 * 
 * Ejecuta validaciones completas contra la API en vivo en http://localhost:3000:
 * 1. Autenticación con contraseña para ROOT_PLATFORM_OWNER.
 * 2. Validación de emisión de mfa_pending_session y desafío MFA requerido.
 * 3. Rechazo de códigos TOTP inválidos.
 * 4. Aceptación de código TOTP RFC 6238 válido calculado criptográficamente.
 * 5. Emisión de sesión persistente en PostgreSQL con ID único en JWT.
 * 6. Acceso autorizado a rutas Super Admin (/api/auth/me, /api/superadmin/users).
 * 7. Consulta de estado en /api/superadmin/security/overview.
 * 8. Protección de escalación de privilegios sobre la cuenta ROOT.
 * 9. Revocación instantánea de sesión en base de datos.
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const ROOT_EMAIL = 'juandieggovlz@gmail.com';
const ROOT_PASS = 'Root#B5rWc-DvGMGzhJkK$9';
const TOTP_SECRET = 'UC6GI5E2DVU7FQWJVDIKUAPRWLW6WQZM';

// Base32 & TOTP RFC 6238 Generator
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

function generateTotp(secretBase32, offset = 0) {
  const key = base32Decode(secretBase32);
  const step = Math.floor(Date.now() / 1000 / 30) + offset;
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(step), 0);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buf);
  const digest = hmac.digest();

  const offsetIdx = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offsetIdx] & 0x7f) << 24) |
    ((digest[offsetIdx + 1] & 0xff) << 16) |
    ((digest[offsetIdx + 2] & 0xff) << 8) |
    (digest[offsetIdx + 3] & 0xff);

  const code = (binary % 1000000).toString().padStart(6, '0');
  return code;
}

// Helper to extract cookies from set-cookie headers
function extractCookies(response) {
  const raw = response.headers.getSetCookie ? response.headers.getSetCookie() : [response.headers.get('set-cookie')].filter(Boolean);
  const cookies = {};
  for (const cookieStr of raw) {
    const parts = cookieStr.split(';')[0].split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
  return cookies;
}

function buildCookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   INICIANDO SUITE DE AUDITORÍA Y TESTS DE SEGURIDAD');
  console.log('======================================================\n');

  // Limpiar RateLimitStore y resetear lastMfaUsedAt y recoveryCodes para la prueba
  await prisma.rateLimitStore.deleteMany({}).catch(() => {});
  const user = await prisma.user.update({
    where: { email: ROOT_EMAIL },
    data: { lastMfaUsedAt: null }
  }).catch(() => null);
  if (user) {
    await prisma.recoveryCode.updateMany({
      where: { userId: user.id },
      data: { usedAt: null }
    }).catch(() => {});
  }

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

  // ----------------------------------------------------
  // TEST 1: Intento de Login con contraseña incorrecta
  // ----------------------------------------------------
  console.log('\n--- 1. Protección contra credenciales inválidas ---');
  const resBadLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ROOT_EMAIL, password: 'ContrasenaIncorrecta123!' })
  });
  const dataBadLogin = await resBadLogin.json();
  assert(resBadLogin.status === 401, 'Rechaza contraseña incorrecta con status 401');
  assert(!dataBadLogin.success, 'Respuesta indica success: false');

  // ----------------------------------------------------
  // TEST 2: Login con credenciales correctas -> Exige MFA
  // ----------------------------------------------------
  console.log('\n--- 2. Login de Root Owner y Desafío MFA Obligatorio ---');
  const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ROOT_EMAIL, password: ROOT_PASS })
  });
  const dataLogin = await resLogin.json();
  const loginCookies = extractCookies(resLogin);

  assert(resLogin.status === 200, 'Login inicial retorna status 200');
  assert(dataLogin.mfaRequired === true, 'Respuesta exige mfaRequired: true');
  assert(dataLogin.redirect === '/login/mfa', 'Redirección apunta a /login/mfa');
  assert(!!loginCookies['mfa_pending_session'], 'Cookie temporal mfa_pending_session emitida');
  assert(!loginCookies['owner_session'], 'NO se emite cookie final de sesión antes de verificar MFA');

  const pendingCookieHeader = buildCookieHeader({ mfa_pending_session: loginCookies['mfa_pending_session'] });

  // ----------------------------------------------------
  // TEST 3: Verificación MFA con código TOTP incorrecto
  // ----------------------------------------------------
  console.log('\n--- 3. Verificación MFA con Código Inválido ---');
  const resBadMfa = await fetch(`${BASE_URL}/api/auth/mfa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pendingCookieHeader
    },
    body: JSON.stringify({ code: '000000', method: 'totp' })
  });
  const dataBadMfa = await resBadMfa.json();
  assert(resBadMfa.status === 400 || resBadMfa.status === 401, 'Rechaza código TOTP inválido (400/401)');
  assert(!dataBadMfa.success, 'Respuesta indica error de verificación');

  // ----------------------------------------------------
  // TEST 4: Verificación MFA con código TOTP RFC 6238 Válido
  // ----------------------------------------------------
  console.log('\n--- 4. Verificación MFA Exitosa con Algoritmo RFC 6238 ---');
  // Asegurarnos de no colisionar con la ventana de protección de repetición (Replay Protection)
  const remainingInStep = 30 - (Math.floor(Date.now() / 1000) % 30);
  if (remainingInStep < 2 || remainingInStep > 28) {
    console.log(`     (Esperando ${remainingInStep + 1}s para el siguiente ciclo TOTP RFC 6238...)`);
    await new Promise(r => setTimeout(r, (remainingInStep + 1) * 1000));
  }
  const validTotp = generateTotp(TOTP_SECRET);
  console.log(`     (Generado código TOTP en ventana activa: ${validTotp})`);

  const resGoodMfa = await fetch(`${BASE_URL}/api/auth/mfa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pendingCookieHeader
    },
    body: JSON.stringify({ code: validTotp, method: 'totp' })
  });
  const dataGoodMfa = await resGoodMfa.json();
  const mfaCookies = extractCookies(resGoodMfa);

  assert(resGoodMfa.status === 200, 'Verificación MFA retorna status 200');
  assert(dataGoodMfa.success === true, 'Respuesta indica success: true');
  assert(dataGoodMfa.redirect === '/superadmin/dashboard', 'Redirige a /superadmin/dashboard');
  assert(!!mfaCookies['owner_session'], 'Cookie de sesión final owner_session emitida exitosamente');

  const authenticatedCookieHeader = buildCookieHeader({ owner_session: mfaCookies['owner_session'] });

  // ----------------------------------------------------
  // TEST 4b: Verificación con Código de Recuperación de un Solo Uso
  // ----------------------------------------------------
  console.log('\n--- 4b. Verificación con Código de Recuperación de un Solo Uso ---');
  // Login nuevo para obtener mfa_pending_session
  const resLogin2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ROOT_EMAIL, password: ROOT_PASS })
  });
  const loginCookies2 = extractCookies(resLogin2);
  const pendingCookieHeader2 = buildCookieHeader({ mfa_pending_session: loginCookies2['mfa_pending_session'] });

  const availableCode = '45F3-4D40'; // Primer código de recuperación
  const resRecMfa = await fetch(`${BASE_URL}/api/auth/mfa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pendingCookieHeader2
    },
    body: JSON.stringify({ code: availableCode, method: 'recovery' })
  });
  const dataRecMfa = await resRecMfa.json();
  assert(resRecMfa.status === 200, 'Código de recuperación aceptado con status 200');
  assert(dataRecMfa.success === true, 'Respuesta con recovery code indica success: true');

  // Intento de reusar el mismo código de recuperación ya consumido
  const resLogin3 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ROOT_EMAIL, password: ROOT_PASS })
  });
  const loginCookies3 = extractCookies(resLogin3);
  const pendingCookieHeader3 = buildCookieHeader({ mfa_pending_session: loginCookies3['mfa_pending_session'] });

  const resReuseRec = await fetch(`${BASE_URL}/api/auth/mfa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pendingCookieHeader3
    },
    body: JSON.stringify({ code: availableCode, method: 'recovery' })
  });
  assert(resReuseRec.status === 400 || resReuseRec.status === 401, 'Rechaza código de recuperación ya utilizado (un solo uso garantizado)');

  // ----------------------------------------------------
  // TEST 5: Consulta de Identidad del Propietario (/api/auth/me)
  // ----------------------------------------------------
  console.log('\n--- 5. Consulta de Sesión Activa (/api/auth/me) ---');
  const resMe = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Cookie': authenticatedCookieHeader }
  });
  const dataMe = await resMe.json();

  assert(resMe.status === 200, 'Endpoint /api/auth/me responde 200 OK');
  assert(dataMe.authenticated === true, 'Usuario reporta authenticated: true');
  assert(dataMe.user?.email === ROOT_EMAIL, `Email coincide con ${ROOT_EMAIL}`);
  assert(dataMe.user?.role === 'ROOT_PLATFORM_OWNER', 'Rol verificado como ROOT_PLATFORM_OWNER');

  // ----------------------------------------------------
  // TEST 6: Acceso Autorizado a Directorio de Usuarios
  // ----------------------------------------------------
  console.log('\n--- 6. Acceso a Funciones de Super Admin ---');
  const resUsers = await fetch(`${BASE_URL}/api/superadmin/users`, {
    headers: { 'Cookie': authenticatedCookieHeader }
  });
  const dataUsers = await resUsers.json();

  assert(resUsers.status === 200, 'Endpoint /api/superadmin/users responde 200 OK');
  assert(Array.isArray(dataUsers.users), 'Retorna lista de usuarios');
  console.log(`     (Total de usuarios consultados: ${dataUsers.users?.length || 0})`);

  // ----------------------------------------------------
  // TEST 7: Centro de Seguridad del Propietario (/api/superadmin/security/overview)
  // ----------------------------------------------------
  console.log('\n--- 7. Centro de Seguridad y Estado de Sesiones ---');
  const resSec = await fetch(`${BASE_URL}/api/superadmin/security/overview`, {
    headers: { 'Cookie': authenticatedCookieHeader }
  });
  const dataSec = await resSec.json();

  assert(resSec.status === 200, 'Endpoint /api/superadmin/security/overview responde 200');
  assert(dataSec.user?.mfaEnabled === true, 'MFA reportado como ACTIVO');
  assert(dataSec.user?.availableRecoveryCodesCount > 0, `Códigos de recuperación disponibles: ${dataSec.user?.availableRecoveryCodesCount}`);
  assert(Array.isArray(dataSec.sessions) && dataSec.sessions.length > 0, `Sesiones persistentes registradas en DB: ${dataSec.sessions?.length}`);

  const currentSessionId = dataSec.currentSessionId || dataSec.sessions?.[0]?.id;
  assert(!!currentSessionId, `Sesión actual identificada en PostgreSQL (ID: ${currentSessionId})`);

  // ----------------------------------------------------
  // TEST 8: Protección contra Escalación de Privilegios
  // ----------------------------------------------------
  console.log('\n--- 8. Protección de Integridad del Propietario ---');
  // Intentar degradar o modificar a ROOT_PLATFORM_OWNER con rol no autorizado
  const rootUserId = dataMe.user?.id;
  const resTamper = await fetch(`${BASE_URL}/api/superadmin/users`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // Simulando petición sin ser root o intentando modificar
      'Cookie': authenticatedCookieHeader
    },
    body: JSON.stringify({ userId: rootUserId, role: 'BARBER' })
  });
  // Siendo root mismo o delegado, la regla prohíbe que cualquiera cambie a ROOT_PLATFORM_OWNER o degrade al root
  assert(resTamper.status === 400 || resTamper.status === 403, 'Bloquea alteración ilegítima del rol ROOT_PLATFORM_OWNER (400/403)');

  // ----------------------------------------------------
  // TEST 9: Revocación Instantánea de Sesión en PostgreSQL
  // ----------------------------------------------------
  console.log('\n--- 9. Revocación Instantánea de Sesión en Base de Datos ---');
  const resRevoke = await fetch(`${BASE_URL}/api/superadmin/security/sessions/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authenticatedCookieHeader
    },
    body: JSON.stringify({ sessionId: currentSessionId })
  });
  const dataRevoke = await resRevoke.json();
  assert(resRevoke.status === 200 && dataRevoke.success === true, 'Revocación de sesión procesada exitosamente');

  // Intentar hacer una llamada con el JWT original tras revocar la sesión en DB
  const resPostRevoke = await fetch(`${BASE_URL}/api/superadmin/users`, {
    headers: { 'Cookie': authenticatedCookieHeader }
  });
  assert(resPostRevoke.status === 401 || resPostRevoke.status === 403, `Llamada subsiguiente rechazada con 401/403 (Status: ${resPostRevoke.status})`);

  // ----------------------------------------------------
  // RESUMEN FINAL
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`   RESULTADO DE PRUEBAS: ${passed}/${total} COMPLETADAS CON ÉXITO`);
  console.log('======================================================\n');

  if (passed === total) {
    console.log('🎉 TODAS LAS PRUEBAS DE SEGURIDAD PASARON SATISFACTORIAMENTE.');
  } else {
    console.error('⚠️ ALGUNAS PRUEBAS FALLARON. REVISA LOS DETALLES.');
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Error fatal durante las pruebas:', e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
