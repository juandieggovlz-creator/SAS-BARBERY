/**
 * lib/email/templates/layout.ts
 * Master layout HTML y utilidades de estilo para correos transaccionales de BarberOS.
 */

export const OFFICIAL_CONTACT_EMAIL = 'barberos.contacto@gmail.com'

export interface EmailLayoutOptions {
  preheader?: string
  headline: string
  subtitle?: string
  contentHtml: string
  actionButton?: {
    label: string
    url: string
  }
  footerNote?: string
}

export function renderMasterEmailLayout(options: EmailLayoutOptions): string {
  const {
    preheader = 'BarberOS — Plataforma de Gestión y Automatización para Barberías',
    headline,
    subtitle,
    contentHtml,
    actionButton,
    footerNote
  } = options

  const currentYear = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${headline} — BarberOS</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #08090c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #0e1015; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; }
    .btn-primary { display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #09090b !important; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 12px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35); }
    .btn-primary:hover { background-color: #fbbf24; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; border-radius: 0 !important; border: none !important; }
      .content-padding { padding: 24px 20px !important; }
      .header-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #08090c;">

  <!-- Preheader oculto para clientes de correo -->
  <div style="display: none; font-size: 1px; color: #08090c; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #0e1015; border: 1px solid #27272a; border-radius: 20px;">
          
          <!-- HEADER -->
          <tr>
            <td class="header-padding" style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #1f2025; background: linear-gradient(180deg, #16181f 0%, #0e1015 100%);">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle;">
                          <div style="background-color: #f59e0b; width: 34px; height: 34px; border-radius: 10px; text-align: center; line-height: 34px; font-weight: 900; color: #000; font-size: 16px;">
                            ✂️
                          </div>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <span style="font-size: 19px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em; text-transform: uppercase;">
                            BARBER<span style="color: #f59e0b;">OS</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 999px; color: #f59e0b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
                      NOTIFICACIÓN OFICIAL
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO SECTION -->
          <tr>
            <td class="content-padding" style="padding: 32px 36px 12px 36px;">
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3; letter-spacing: -0.02em;">
                ${headline}
              </h1>
              ${subtitle ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #a1a1aa; line-height: 1.5;">${subtitle}</p>` : ''}
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td class="content-padding" style="padding: 0 36px 28px 36px;">
              ${contentHtml}

              <!-- ACTION BUTTON -->
              ${actionButton ? `
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionButton.url}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="26%" stroke="f" fillcolor="#f59e0b">
                      <w:anchorlock/>
                      <center style="color:#09090b;font-family:sans-serif;font-size:13px;font-weight:bold;text-transform:uppercase;">${actionButton.label}</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${actionButton.url}" class="btn-primary" style="display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #09090b !important; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 12px;">
                      ${actionButton.label} &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.4;">
                      ¿No puedes hacer clic? Copia y pega este enlace en tu navegador:<br>
                      <a href="${actionButton.url}" style="color: #f59e0b; word-break: break-all; text-decoration: underline;">${actionButton.url}</a>
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${footerNote ? `
              <div style="margin-top: 24px; padding: 14px 18px; background-color: #16181f; border-left: 3px solid #f59e0b; border-radius: 8px; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                ${footerNote}
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; border-top: 1px solid #1f2025; background-color: #090a0d; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #ffffff;">
                      BarberOS Platform
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #71717a; line-height: 1.5;">
                      Sistema integral de agendamiento, comisiones y operaciones para barberías modernas.
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 11px; color: #a1a1aa;">
                      Canal oficial de soporte: 
                      <a href="mailto:${OFFICIAL_CONTACT_EMAIL}" style="color: #f59e0b; text-decoration: none; font-weight: 600;">
                        ${OFFICIAL_CONTACT_EMAIL}
                      </a>
                    </p>
                    <p style="margin: 0; font-size: 10px; color: #52525b; line-height: 1.4;">
                      &copy; ${currentYear} BarberOS. Este mensaje fue generado automáticamente por razones de seguridad o servicio. Por favor no compartas enlaces de acceso con personas no autorizadas.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}
