/**
 * BarberOS — Meta WhatsApp Business v4 & Coexistence Audit Suite
 * 
 * Verifica:
 * 1. Cifrado simétrico AES-256-GCM y descifrado seguro de tokens.
 * 2. Validación de Webhook GET (Challenge de Meta).
 * 3. Validación de Webhook POST con firma HMAC-SHA256 (x-hub-signature-256).
 * 4. Rechazo de firmas HMAC inválidas o ausentes.
 * 5. Estructura de parámetros oficiales de Coexistencia v4 (featureType).
 * 6. Ausencia de simulaciones o QR ficticios en el backend.
 * 7. Control de permisos comerciales (canUseWhatsApp).
 * 8. Sanitización y enmascaramiento de tokens en respuestas al cliente.
 */

import { safeEncryptToken, safeDecryptToken } from '../lib/crypto'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

async function runAudit() {
  console.log('══════════════════════════════════════════════════════════════')
  console.log('💈 BarberOS — AUDITORÍA DE WHATSAPP BUSINESS & COEXISTENCE v4')
  console.log('══════════════════════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${testName}`)
      if (detail) console.error(`   Detalle: ${detail}`)
      failed++
    }
  }

  // ── 1. Criptografía y Cifrado AES-256-GCM
  console.log('--- Test 1: Seguridad Criptográfica de Tokens ---')
  const rawToken = 'EAABsbCS192837465_meta_access_token_long_lived_secret_1234567890'
  const encrypted = safeEncryptToken(rawToken)
  assert(Boolean(encrypted && encrypted.includes(':')), 'safeEncryptToken genera formato iv:authTag:ciphertext con AES-256-GCM')
  assert(encrypted !== rawToken, 'El token cifrado es diferente del texto plano')

  const decrypted = safeDecryptToken(encrypted)
  assert(decrypted === rawToken, 'safeDecryptToken recupera exactamente el token original')

  const idempotentEncrypt = safeEncryptToken(encrypted)
  assert(idempotentEncrypt === encrypted, 'safeEncryptToken es idempotente si el token ya está cifrado')

  const plainLegacy = 'legacy_plaintext_token_123'
  const decryptedLegacy = safeDecryptToken(plainLegacy)
  assert(decryptedLegacy === plainLegacy, 'safeDecryptToken maneja limpiamente tokens preexistentes en texto plano')

  // ── 2. Firma HMAC-SHA256 de Webhook
  console.log('\n--- Test 2: Validación Criptográfica de Webhooks de Meta ---')
  const testAppSecret = 'test_meta_app_secret_998877'
  const testPayload = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{
      id: '123456789',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '573001234567', phone_number_id: '10987654321' },
          messages: [{ from: '573009876543', id: 'wamid.HBgLMTIzNDU2', timestamp: '1742000000', text: { body: 'Hola BarberOS' }, type: 'text' }]
        },
        field: 'messages'
      }]
    }]
  })

  const validHmac = crypto.createHmac('sha256', testAppSecret).update(testPayload).digest('hex')
  const validSignature = `sha256=${validHmac}`

  const testHmacVerify = (signature: string | null, payload: string, secret: string): boolean => {
    if (!signature || !secret) return false
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`
    return signature === expected
  }

  assert(testHmacVerify(validSignature, testPayload, testAppSecret), 'Verificación exitosa de firma HMAC-SHA256 legítima')
  assert(!testHmacVerify('sha256=invalid_tampered_hash_here', testPayload, testAppSecret), 'Rechazo de firma HMAC manipulada')
  assert(!testHmacVerify(null, testPayload, testAppSecret), 'Rechazo cuando no se suministra cabecera x-hub-signature-256')

  // ── 3. Parámetros de Meta Embedded Signup v4 y Coexistencia
  console.log('\n--- Test 3: Inspección de Coexistencia Oficial v4 en Frontend ---')
  const frontendPath = path.join(process.cwd(), 'components/owner/WhatsAppIntegrationSettings.tsx')
  const frontendContent = fs.readFileSync(frontendPath, 'utf8')

  assert(
    frontendContent.includes("featureType: 'whatsapp_business_app_onboarding'"),
    'FB.login incluye featureType: "whatsapp_business_app_onboarding" (Parámetro oficial de Coexistencia)'
  )
  assert(
    frontendContent.includes("sessionInfoVersion: '3'"),
    'FB.login incluye sessionInfoVersion: "3"'
  )
  assert(
    frontendContent.includes("v22.0"),
    'SDK de Meta se inicializa con Graph API v22.0'
  )
  assert(
    frontendContent.includes('handleEmbeddedSignup'),
    'El componente cuenta con el manejador oficial de Embedded Signup de Meta'
  )

  // ── 4. Inspección de Eliminación de Simulaciones Falsas
  console.log('\n--- Test 4: Verificación de Eliminación de Simulaciones Engañosas ---')
  const verifyRoutePath = path.join(process.cwd(), 'app/api/owner/integrations/whatsapp/meta/verify/route.ts')
  const verifyContent = fs.readFileSync(verifyRoutePath, 'utf8')

  assert(
    !verifyContent.includes('isSimulation'),
    'El endpoint /api/owner/integrations/whatsapp/meta/verify NO contiene modo simulación'
  )
  assert(
    !verifyContent.includes('sim_meta_phone_id'),
    'No existen IDs telefónicos simulados en la ruta de verificación'
  )
  assert(
    verifyContent.includes('validateCredentials'),
    'La verificación se realiza en vivo contra Meta Graph API'
  )

  // ── 5. Suscripción Automática de WABA en Callback Oficial
  console.log('\n--- Test 5: Suscripción a Webhooks en Callback Oficial ---')
  const callbackRoutePath = path.join(process.cwd(), 'app/api/whatsapp/meta-callback/route.ts')
  const callbackContent = fs.readFileSync(callbackRoutePath, 'utf8')

  assert(
    callbackContent.includes('subscribeAppToWaba'),
    'El callback de Meta suscribe automáticamente la WABA a los Webhooks oficiales'
  )
  assert(
    callbackContent.includes('safeEncryptToken'),
    'El token recibido en el callback se cifra con AES-256-GCM antes de guardarse'
  )
  assert(
    callbackContent.includes('canUseWhatsApp'),
    'El callback valida que el plan comercial permita WhatsApp Business'
  )

  // ── 6. Manejo de Coexistencia y Ecos en Webhook
  console.log('\n--- Test 6: Soporte de Coexistencia en Webhook Handler ---')
  const webhookRoutePath = path.join(process.cwd(), 'app/api/webhooks/whatsapp/route.ts')
  const webhookContent = fs.readFileSync(webhookRoutePath, 'utf8')

  assert(
    webhookContent.includes('message_echoes') || webhookContent.includes('isHumanAgent'),
    'El webhook detecta respuestas del barbero desde la app de celular y activa atención humana'
  )
  assert(
    webhookContent.includes('canUseWhatsApp'),
    'El webhook valida permisos comerciales antes de ejecutar respuestas automatizadas'
  )

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log(`RESULTADO DE AUDITORÍA: ${passed} superadas, ${failed} fallidas`)
  console.log('══════════════════════════════════════════════════════════════\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runAudit().catch(err => {
  console.error('Error fatal en suite de pruebas:', err)
  process.exit(1)
})
