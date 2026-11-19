/**
 * lib/email/templates/index.ts
 * Generadores de plantillas HTML y texto plano para correos de BarberOS.
 */

import {
  renderMasterEmailLayout,
  OFFICIAL_CONTACT_EMAIL
} from './layout'
import {
  BarberInviteEmailParams,
  BranchAdminInviteEmailParams,
  PasswordResetEmailParams,
  AppointmentConfirmationEmailParams,
  AccountSecurityAlertEmailParams,
  SupportTicketCreatedEmailParams,
  SupportTicketReplyEmailParams,
  SupportTicketResolvedEmailParams
} from '../types'

// ─── 1. Invitación para Barbero ──────────────────────────────────────────────

export function generateBarberInviteTemplate(params: BarberInviteEmailParams) {
  const { barberName, businessName, inviteLink, expiresHours = 72 } = params

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
      Hola <strong style="color: #ffffff;">${barberName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
      Has sido invitado a formar parte del equipo de <strong style="color: #f59e0b;">${businessName}</strong> en la plataforma BarberOS.
    </p>
    <div style="background-color: #14161d; border: 1px solid #27272a; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em;">
        Beneficios de tu portal de barbero:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #a1a1aa; line-height: 1.6;">
        <li>Control en tiempo real de tus citas agendadas.</li>
        <li>Liquidación y reporte transparente de tus comisiones.</li>
        <li>Gestión de tus turnos, pausas y horarios semanales.</li>
      </ul>
    </div>
    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Haz clic en el botón siguiente para activar tu cuenta y configurar tu contraseña o PIN de acceso seguro:
    </p>
  `

  const html = renderMasterEmailLayout({
    preheader: `Invitación para unirte al equipo de ${businessName} en BarberOS`,
    headline: `¡Bienvenido a ${businessName}!`,
    subtitle: `Configura tu portal de barbero y comienza a gestionar tu agenda.`,
    contentHtml,
    actionButton: {
      label: 'Activar Mi Cuenta de Barbero',
      url: inviteLink
    },
    footerNote: `Este enlace de activación es de un solo uso y expirará en ${expiresHours} horas. Si no esperabas esta invitación, puedes ignorar este correo o comunicarte con ${OFFICIAL_CONTACT_EMAIL}.`
  })

  const text = `
Hola ${barberName},

Has sido invitado a formar parte del equipo de ${businessName} en la plataforma BarberOS.

Para activar tu cuenta y establecer tu PIN/contraseña de acceso, ingresa al siguiente enlace seguro:
${inviteLink}

Este enlace expira en ${expiresHours} horas.

Soporte oficial: ${OFFICIAL_CONTACT_EMAIL}
© BarberOS
`.trim()

  return { html, text, subject: `Invitación para unirte a ${businessName} en BarberOS` }
}

// ─── 2. Invitación para Administrador de Sede ────────────────────────────────

export function generateBranchAdminInviteTemplate(params: BranchAdminInviteEmailParams) {
  const { branchName, companyName, inviteLink, expiresHours = 72 } = params

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
      Hola,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
      Has recibido una designación oficial como <strong style="color: #f59e0b;">Administrador de Sede (Branch Admin)</strong> para la sede <strong style="color: #ffffff;">${branchName}</strong> perteneciente a la empresa <strong style="color: #ffffff;">${companyName}</strong>.
    </p>
    <div style="background-color: #14161d; border: 1px solid #27272a; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em;">
        Tus atribuciones delegadas:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #a1a1aa; line-height: 1.6;">
        <li>Supervisión de la agenda y turnos de la sede <strong>${branchName}</strong>.</li>
        <li>Control del flujo de caja diario y arqueos de turno.</li>
        <li>Gestión del equipo de barberos y citas de clientes.</li>
      </ul>
    </div>
    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Haz clic a continuación para aceptar la invitación y completar el registro de tu acceso administrativo:
    </p>
  `

  const html = renderMasterEmailLayout({
    preheader: `Invitación de Administración de Sede (${branchName}) — ${companyName}`,
    headline: `Administración de Sede Delegada`,
    subtitle: `Se te ha conferido el rol de Administrador de Sede para ${branchName}.`,
    contentHtml,
    actionButton: {
      label: 'Aceptar y Configurar Acceso',
      url: inviteLink
    },
    footerNote: `Este enlace confidencial expira en ${expiresHours} horas. No compartas esta URL. Dudas o consultas: ${OFFICIAL_CONTACT_EMAIL}.`
  })

  const text = `
Hola,

Has recibido una designación oficial como Administrador de Sede para ${branchName} (${companyName}) en BarberOS.

Para aceptar la invitación y configurar tus credenciales de acceso:
${inviteLink}

Este enlace expira en ${expiresHours} horas.
Soporte oficial: ${OFFICIAL_CONTACT_EMAIL}
`.trim()

  return { html, text, subject: `Invitación de Administración de Sede: ${branchName} (${companyName})` }
}

// ─── 3. Recuperación de Contraseña ──────────────────────────────────────────

export function generatePasswordResetTemplate(params: PasswordResetEmailParams) {
  const { userName, resetLink, expiresMinutes = 60 } = params

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
      Hola <strong style="color: #ffffff;">${userName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en BarberOS.
    </p>
    <div style="background-color: #14161d; border: 1px solid #27272a; border-radius: 14px; padding: 16px 20px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
        ⏱️ Este enlace es personal, confidencial y será válido durante los próximos <strong style="color: #ffffff;">${expiresMinutes} minutos</strong>.
      </p>
    </div>
    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Para definir tu nueva contraseña segura, haz clic en el botón siguiente:
    </p>
  `

  const html = renderMasterEmailLayout({
    preheader: `Instrucciones para restablecer tu contraseña en BarberOS`,
    headline: `Restablece tu contraseña`,
    subtitle: `Solicitud de seguridad para tu cuenta de usuario.`,
    contentHtml,
    actionButton: {
      label: 'Restablecer Mi Contraseña',
      url: resetLink
    },
    footerNote: `Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura. Tu contraseña actual no cambiará sin este enlace. Para reportar anomalías: ${OFFICIAL_CONTACT_EMAIL}.`
  })

  const text = `
Hola ${userName},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en BarberOS.

Para definir una nueva contraseña, ingresa al siguiente enlace seguro (válido por ${expiresMinutes} minutos):
${resetLink}

Si tú no realizaste esta solicitud, ignora este mensaje.
Canal oficial: ${OFFICIAL_CONTACT_EMAIL}
`.trim()

  return { html, text, subject: `Restablecimiento de contraseña — BarberOS` }
}

// ─── 4. Confirmación de Cita / Reserva ───────────────────────────────────────

export function generateAppointmentConfirmationTemplate(params: AppointmentConfirmationEmailParams) {
  const {
    clientName,
    businessName,
    barberName,
    serviceName,
    price,
    date,
    time,
    reservationCode,
    manageLink
  } = params

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
      ¡Hola <strong style="color: #ffffff;">${clientName}</strong>! 👋
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
      Tu cita en <strong style="color: #f59e0b;">${businessName}</strong> ha sido agendada con éxito.
    </p>

    <!-- Resumen de Cita -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #14161d; border: 1px solid #27272a; border-radius: 14px; margin-bottom: 20px; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #1f2025;">
          <span style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em;">CÓDIGO DE RESERVA</span>
          <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 800; color: #ffffff; font-family: monospace;">${reservationCode}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Fecha:</td>
              <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #ffffff;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Hora:</td>
              <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #ffffff;">${time}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Barbero:</td>
              <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #ffffff;">${barberName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Servicio:</td>
              <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #ffffff;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Valor:</td>
              <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #f59e0b;">${price}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Te esperamos puntualmente. Si necesitas reprogramar o cancelar tu turno, puedes hacerlo desde tu comprobante:
    </p>
  `

  const html = renderMasterEmailLayout({
    preheader: `Confirmación de cita en ${businessName} — Código: ${reservationCode}`,
    headline: `¡Tu Cita está Confirmada! ✂️`,
    subtitle: `Detalles de tu reserva en ${businessName}.`,
    contentHtml,
    actionButton: manageLink ? {
      label: 'Ver Comprobante de Reserva',
      url: manageLink
    } : undefined,
    footerNote: `BarberOS procesa esta confirmación en nombre de ${businessName}. Consultas directas: ${OFFICIAL_CONTACT_EMAIL}.`
  })

  const text = `
¡Hola ${clientName}!

Tu cita en ${businessName} ha sido confirmada con éxito.

Código de Reserva: ${reservationCode}
Fecha: ${date}
Hora: ${time}
Barbero: ${barberName}
Servicio: ${serviceName} (${price})

${manageLink ? `Gestiona tu cita aquí: ${manageLink}` : ''}

Gracias por tu preferencia.
Canal oficial: ${OFFICIAL_CONTACT_EMAIL}
`.trim()

  return { html, text, subject: `Confirmación de cita: ${serviceName} en ${businessName} (${reservationCode})` }
}

// ─── 5. Alerta de Seguridad de Cuenta ────────────────────────────────────────

export function generateAccountSecurityAlertTemplate(params: AccountSecurityAlertEmailParams) {
  const { userName, title, description, details, actionLink, actionLabel } = params

  let detailsTableHtml = ''
  if (details && Object.keys(details).length > 0) {
    const rows = Object.entries(details)
      .map(([k, v]) => `
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #71717a;">${k}:</td>
          <td align="right" style="padding: 6px 0; font-size: 12px; font-family: monospace; font-weight: 600; color: #ffffff;">${v}</td>
        </tr>
      `)
      .join('')

    detailsTableHtml = `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #14161d; border: 1px solid #27272a; border-radius: 12px; padding: 14px 18px; margin: 18px 0;">
        ${rows}
      </table>
    `
  }

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
      Hola <strong style="color: #ffffff;">${userName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
      ${description}
    </p>
    ${detailsTableHtml}
    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Si fuiste tú quien realizó esta acción, no es necesario hacer nada más. Si no reconoces esta actividad, asegura tu cuenta de inmediato.
    </p>
  `

  const html = renderMasterEmailLayout({
    preheader: `Alerta de seguridad BarberOS: ${title}`,
    headline: title,
    subtitle: `Aviso preventivo de seguridad para tu cuenta.`,
    contentHtml,
    actionButton: actionLink ? {
      label: actionLabel || 'Revisar Mi Cuenta',
      url: actionLink
    } : undefined,
    footerNote: `Canal prioritario de seguridad y soporte: ${OFFICIAL_CONTACT_EMAIL}.`
  })

  const text = `
Hola ${userName},

Alerta de seguridad BarberOS: ${title}
${description}

${details ? Object.entries(details).map(([k, v]) => `${k}: ${v}`).join('\n') : ''}

${actionLink ? `Revisa tu cuenta aquí: ${actionLink}` : ''}
Soporte oficial: ${OFFICIAL_CONTACT_EMAIL}
`.trim()

  return { html, text, subject: `Alerta de Seguridad BarberOS: ${title}` }
}

// ─── 6. Confirmación de Creación de Ticket de Soporte ─────────────────────────

export function generateSupportTicketCreatedTemplate(params: SupportTicketCreatedEmailParams) {
  const { userName, businessName, ticketCode, subject, priority, description, ticketLink } = params

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
      Hola <strong style="color: #ffffff;">${userName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
      Hemos recibido tu solicitud de soporte para <strong style="color: #ffffff;">${businessName}</strong>. Nuestro equipo técnico la está revisando y te responderá a la brevedad.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #14161d; border: 1px solid #27272a; border-radius: 12px; padding: 14px 18px; margin: 18px 0;">
      <tr>
        <td style="padding: 6px 0; font-size: 12px; color: #71717a;">Ticket:</td>
        <td align="right" style="padding: 6px 0; font-size: 12px; font-family: monospace; font-weight: 700; color: #f59e0b;">#${ticketCode}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 12px; color: #71717a;">Asunto:</td>
        <td align="right" style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #ffffff;">${subject}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 12px; color: #71717a;">Prioridad:</td>
        <td align="right" style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #ffffff;">${priority}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 12px; color: #71717a;">Estado:</td>
        <td align="right" style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #f59e0b;">Abierto</td>
      </tr>
    </table>

    <div style="background-color: #0e1015; border-left: 3px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #71717a; letter-spacing: 0.05em;">Descripción reportada:</p>
      <p style="margin: 0; font-size: 13px; color: #e4e4e7; line-height: 1.5; white-space: pre-wrap;">${description}</p>
    </div>

    <p style="margin: 16px 0 0 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Puedes responder a este ticket o consultar su avance en cualquier momento desde tu panel de BarberOS.
    </p>
  `

  const html = renderMasterEmailLayout({
    preheader: `Ticket #${ticketCode} creado con éxito: ${subject}`,
    headline: `Ticket de Soporte #${ticketCode}`,
    subtitle: `Hemos recibido tu solicitud de soporte técnico.`,
    contentHtml,
    actionButton: {
      label: 'Ver y Gestionar Ticket',
      url: ticketLink
    },
    footerNote: `Canal oficial de soporte: ${OFFICIAL_CONTACT_EMAIL}.`
  })

  const text = `
Hola ${userName},

Hemos recibido tu solicitud de soporte para ${businessName}.
Ticket: #${ticketCode}
Asunto: ${subject}
Prioridad: ${priority}
Estado: Abierto

Descripción:
${description}

Puedes consultar y responder a tu ticket aquí:
${ticketLink}

Canal oficial: ${OFFICIAL_CONTACT_EMAIL}
`.trim()

  return { html, text, subject: `Ticket #${ticketCode}: ${subject} — BarberOS` }
}

// ─── 7. Notificación de Nueva Respuesta en Ticket ─────────────────────────────

export function generateSupportTicketReplyTemplate(params: SupportTicketReplyEmailParams) {
  const { userName, businessName, ticketCode, subject, senderName, replySnippet, ticketLink } = params

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
      Hola <strong style="color: #ffffff;">${userName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
      Tienes una nueva respuesta en el ticket <strong style="color: #ffffff;">#${ticketCode}</strong> (${businessName}):
    </p>

    <div style="background-color: #14161d; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 18px 0;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #f59e0b; letter-spacing: 0.05em;">De: ${senderName}</span>
      </div>
      <p style="margin: 0; font-size: 13px; color: #ffffff; line-height: 1.6; white-space: pre-wrap;">${replySnippet}</p>
    </div>

    <p style="margin: 16px 0 0 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Accede a la plataforma para continuar la conversación con el equipo de soporte.
    </p>
  `

  const html = renderMasterEmailLayout({
    preheader: `Nueva respuesta en Ticket #${ticketCode}: ${subject}`,
    headline: `Nueva Respuesta en Ticket #${ticketCode}`,
    subtitle: `El equipo de soporte te ha respondido.`,
    contentHtml,
    actionButton: {
      label: 'Responder al Ticket',
      url: ticketLink
    },
    footerNote: `Canal oficial de soporte: ${OFFICIAL_CONTACT_EMAIL}.`
  })

  const text = `
Hola ${userName},

Nueva respuesta en el Ticket #${ticketCode} (${businessName}):
De: ${senderName}

"${replySnippet}"

Accede a la plataforma para responder:
${ticketLink}

Canal oficial: ${OFFICIAL_CONTACT_EMAIL}
`.trim()

  return { html, text, subject: `Nueva respuesta en Ticket #${ticketCode}: ${subject}` }
}

// ─── 8. Notificación de Ticket Resuelto ────────────────────────────────────────

export function generateSupportTicketResolvedTemplate(params: SupportTicketResolvedEmailParams) {
  const { userName, businessName, ticketCode, subject, ticketLink } = params

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
      Hola <strong style="color: #ffffff;">${userName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
      Te informamos que tu ticket <strong style="color: #ffffff;">#${ticketCode}</strong> (${subject}) ha sido marcado como <strong style="color: #10b981;">RESUELTO</strong> por nuestro equipo de soporte.
    </p>

    <div style="background-color: #0e1e17; border: 1px solid #059669; border-radius: 12px; padding: 16px; margin: 18px 0; text-align: center;">
      <span style="font-size: 13px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em;">✓ Caso Solucionado</span>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #a7f3d0;">
        Si consideras que el inconveniente aún persiste, puedes reabrir el ticket enviando un nuevo mensaje.
      </p>
    </div>

    <p style="margin: 16px 0 0 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Agradecemos tu confianza en BarberOS.
    </p>
  `

  const html = renderMasterEmailLayout({
    preheader: `Ticket #${ticketCode} marcado como Resuelto`,
    headline: `Ticket #${ticketCode} Resuelto`,
    subtitle: `Tu solicitud de soporte ha sido atendida.`,
    contentHtml,
    actionButton: {
      label: 'Ver Ticket en Plataforma',
      url: ticketLink
    },
    footerNote: `Canal oficial de soporte: ${OFFICIAL_CONTACT_EMAIL}.`
  })

  const text = `
Hola ${userName},

Tu ticket #${ticketCode} (${subject}) ha sido marcado como RESUELTO en BarberOS.
Si consideras que el inconveniente persiste, puedes reabrir el ticket respondiendo en la plataforma:
${ticketLink}

Canal oficial: ${OFFICIAL_CONTACT_EMAIL}
`.trim()

  return { html, text, subject: `Ticket #${ticketCode} Resuelto — BarberOS` }
}
