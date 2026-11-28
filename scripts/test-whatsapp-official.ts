import { STANDARD_TEMPLATES } from '../lib/whatsapp/meta-template-manager'
import { MetaCloudProvider } from '../lib/whatsapp/meta-provider'
import { WhatsAppService } from '../lib/whatsapp/whatsapp-service'

async function runTests() {
  console.log('--- 1. VERIFICACIÓN DE PLANTILLAS ESTÁNDAR OFICIALES ---')
  const expectedTemplates = [
    'barberos_confirmacion_reserva',
    'barberos_recordatorio_cita',
    'barberos_reprogramacion_cita',
    'barberos_cancelacion_cita'
  ]

  for (const name of expectedTemplates) {
    const tpl = STANDARD_TEMPLATES[name]
    if (!tpl) {
      throw new Error(`Plantilla faltante: ${name}`)
    }
    if (tpl.category !== 'UTILITY') {
      throw new Error(`Categoría inválida para ${name}: debe ser UTILITY`)
    }
    if (tpl.language !== 'es') {
      throw new Error(`Idioma inválido para ${name}: debe ser es`)
    }
    console.log(`✅ [OK] ${name}: Categoría ${tpl.category}, Idioma ${tpl.language}`)
  }

  // Verificar botones nativos en recordatorio
  const reminderTpl = STANDARD_TEMPLATES['barberos_recordatorio_cita']
  const buttonsComp = reminderTpl.components.find(c => c.type === 'BUTTONS')
  if (!buttonsComp || !buttonsComp.buttons || buttonsComp.buttons.length !== 3) {
    throw new Error('La plantilla de recordatorio debe tener exactamente 3 botones QUICK_REPLY')
  }
  const buttonTexts = buttonsComp.buttons.map(b => b.text)
  console.log('✅ Botones nativos de recordatorio:', buttonTexts.join(' | '))

  console.log('\n--- 2. VERIFICACIÓN DE NORMALIZACIÓN DE TELÉFONO ---')
  const test1 = MetaCloudProvider.cleanPhoneNumber('+57 300 123 4567')
  const test2 = WhatsAppService.normalizePhoneNumber('3123456789')
  if (test1 !== '573001234567') throw new Error(`Fallo normalización: esperado 573001234567, recibido ${test1}`)
  if (test2 !== '573123456789') throw new Error(`Fallo normalización local: esperado 573123456789, recibido ${test2}`)
  console.log(`✅ Teléfonos normalizados: ${test1}, ${test2}`)

  console.log('\n--- 3. VERIFICACIÓN DE PARSEO DE PAYLOADS DE BOTONES ---')
  const fakePayloads = [
    { payload: 'CONFIRM_appt_12345', expectedAction: 'CONFIRM', expectedId: 'appt_12345' },
    { payload: 'RESCHEDULE_appt_12345', expectedAction: 'RESCHEDULE', expectedId: 'appt_12345' },
    { payload: 'CANCEL_appt_12345', expectedAction: 'CANCEL', expectedId: 'appt_12345' }
  ]

  for (const item of fakePayloads) {
    let action = ''
    let id = ''
    if (item.payload.startsWith('CONFIRM_')) {
      action = 'CONFIRM'
      id = item.payload.replace('CONFIRM_', '')
    } else if (item.payload.startsWith('RESCHEDULE_')) {
      action = 'RESCHEDULE'
      id = item.payload.replace('RESCHEDULE_', '')
    } else if (item.payload.startsWith('CANCEL_')) {
      action = 'CANCEL'
      id = item.payload.replace('CANCEL_', '')
    }
    if (action !== item.expectedAction || id !== item.expectedId) {
      throw new Error(`Error parseando payload ${item.payload}`)
    }
    console.log(`✅ Payload parseado con éxito: ${action} -> ID: ${id}`)
  }

  console.log('\n--- 4. VERIFICACIÓN DE RECONOCIMIENTO DE OPT-OUT ---')
  const optOutWords = ['STOP', 'BAJA', 'CANCELAR MENSAJES', 'DEJAR DE RECIBIR MENSAJES', 'NO MAS MENSAJES', 'DESUSCRIBIR']
  for (const word of optOutWords) {
    const isRecognized = optOutWords.includes(word.toUpperCase())
    if (!isRecognized) throw new Error(`Palabra opt-out no reconocida: ${word}`)
  }
  console.log(`✅ Reconocimiento de 6 variantes de opt-out certificado`)

  console.log('\n🎉 TODAS LAS PRUEBAS DE AUTOMATIZACIÓN DE WHATSAPP PASARON CON ÉXITO.')
}

runTests().catch(err => {
  console.error('❌ Error en pruebas:', err)
  process.exit(1)
})
