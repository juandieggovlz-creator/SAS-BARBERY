/**
 * BarberOS — Test de Seguridad y Funcionalidad para Cron Reminders
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'a9dcef4d05c4067379ce0ca7683c76714ae6b25bb01e01d1789b704367036af4';

async function runTests() {
  console.log('\n======================================================');
  console.log('   PRUEBAS DE SEGURIDAD: /api/cron/reminders');
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

  // 1. Sin encabezado de autorización
  console.log('--- 1. Petición no autenticada ---');
  const resNoAuth = await fetch(`${BASE_URL}/api/cron/reminders`);
  const dataNoAuth = await resNoAuth.json();
  assert(resNoAuth.status === 401, 'Rechaza petición sin token con status 401');
  assert(dataNoAuth.error === 'No autorizado', 'Mensaje de error: No autorizado');

  // 2. Con token inválido
  console.log('\n--- 2. Petición con token incorrecto ---');
  const resBadAuth = await fetch(`${BASE_URL}/api/cron/reminders`, {
    headers: { 'Authorization': 'Bearer token_falso_invalido_123' }
  });
  const dataBadAuth = await resBadAuth.json();
  assert(resBadAuth.status === 401, 'Rechaza token incorrecto con status 401');
  assert(dataBadAuth.error === 'No autorizado', 'Mensaje de error: No autorizado');

  // 3. Con token válido (GET)
  console.log('\n--- 3. Petición GET con CRON_SECRET válido ---');
  const resGoodGet = await fetch(`${BASE_URL}/api/cron/reminders`, {
    headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
  });
  const dataGoodGet = await resGoodGet.json();
  assert(resGoodGet.status === 200, 'Acepta petición GET con status 200');
  assert(dataGoodGet.success === true, 'Respuesta indica success: true');
  assert(typeof dataGoodGet.processed === 'number', `Procesadas ${dataGoodGet.processed} citas en la ventana actual`);

  // 4. Con token válido (POST)
  console.log('\n--- 4. Petición POST con CRON_SECRET válido ---');
  const resGoodPost = await fetch(`${BASE_URL}/api/cron/reminders`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
  });
  const dataGoodPost = await resGoodPost.json();
  assert(resGoodPost.status === 200, 'Acepta petición POST con status 200');
  assert(dataGoodPost.success === true, 'Respuesta POST indica success: true');

  console.log('\n======================================================');
  console.log(`   RESULTADO: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Error fatal durante el test:', e);
  process.exit(1);
});

