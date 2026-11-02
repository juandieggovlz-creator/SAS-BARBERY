const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const qrcode = require('qrcode');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.BAILEYS_PORT ? parseInt(process.env.BAILEYS_PORT, 10) : 3001;
const SESSIONS_BASE_DIR = path.join(process.cwd(), 'data', 'baileys_auth');
const WEBHOOK_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

if (!fs.existsSync(SESSIONS_BASE_DIR)) {
  fs.mkdirSync(SESSIONS_BASE_DIR, { recursive: true });
}

// Mapa en memoria para el estado de cada sesión de negocio
// businessId -> { sock, qr, qrDataUrl, status, phoneNumber, qrResolvers: [] }
const sessions = new Map();

/**
 * Obtiene o crea el contenedor de sesión para un negocio
 */
function getOrCreateSession(businessId) {
  if (!sessions.has(businessId)) {
    sessions.set(businessId, {
      businessId,
      sock: null,
      qr: null,
      qrDataUrl: null,
      status: 'DISCONNECTED',
      phoneNumber: null,
      qrWaiters: []
    });
  }
  return sessions.get(businessId);
}

/**
 * Inicia o reconecta una sesión de WhatsApp para un negocio dado
 */
async function startSession(businessId, forceRestart = false) {
  const session = getOrCreateSession(businessId);

  if (session.sock && !forceRestart) {
    if (session.status === 'CONNECTED' || session.status === 'QR_READY') {
      return session;
    }
  }

  // Cerrar socket previo si existía
  if (session.sock) {
    try {
      session.sock.ev.removeAllListeners();
      session.sock.end(undefined);
    } catch (e) {
      // Ignorar errores al cerrar
    }
    session.sock = null;
  }

  const sessionDir = path.join(SESSIONS_BASE_DIR, businessId);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  session.status = 'CONNECTING';

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'error' }),
      printQRInTerminal: true,
      browser: ['BarberOS WhatsApp', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });

    session.sock = sock;

    // Guardar credenciales automáticamente
    sock.ev.on('creds.update', saveCreds);

    // Monitorear cambios en la conexión y emisión de QR
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // 1. Cuando Baileys genera un código QR nuevo
      if (qr) {
        try {
          const qrDataUrl = await qrcode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });

          session.qr = qr;
          session.qrDataUrl = qrDataUrl;
          session.status = 'QR_READY';

          console.log(`📱 [Baileys] Código QR generado para la barbería: ${businessId}`);

          // Notificar a clientes HTTP en espera del QR
          if (session.qrWaiters && session.qrWaiters.length > 0) {
            const waiters = [...session.qrWaiters];
            session.qrWaiters = [];
            waiters.forEach((cb) => cb({ qr, qrDataUrl, status: 'QR_READY' }));
          }

          // Persistir QR y estado en la base de datos
          await prisma.whatsAppIntegration.updateMany({
            where: { businessId },
            data: {
              provider: 'BAILEYS',
              connectionStatus: 'QR_READY',
              baileysQrCode: qrDataUrl,
              lastSyncedAt: new Date()
            }
          }).catch(err => console.error('[Baileys DB Error] actualizando QR:', err.message));
        } catch (qrErr) {
          console.error('[Baileys] Error creando QR dataUrl:', qrErr);
        }
      }

      // 2. Conexión abierta y autenticada (WhatsApp emparejado con éxito)
      if (connection === 'open') {
        const rawId = sock.user?.id || '';
        const cleanNumber = '+' + rawId.split(':')[0].replace(/\D/g, '');

        session.status = 'CONNECTED';
        session.phoneNumber = cleanNumber;
        session.qr = null;
        session.qrDataUrl = null;

        console.log(`🎉 [Baileys] ¡WhatsApp CONECTADO exitosamente! Barbería: ${businessId} (${cleanNumber})`);

        // Despertar a cualquier cliente en espera
        if (session.qrWaiters && session.qrWaiters.length > 0) {
          const waiters = [...session.qrWaiters];
          session.qrWaiters = [];
          waiters.forEach((cb) => cb({ status: 'CONNECTED', phoneNumber: cleanNumber }));
        }

        // Actualizar en base de datos
        await prisma.whatsAppIntegration.updateMany({
          where: { businessId },
          data: {
            provider: 'BAILEYS',
            connectionStatus: 'CONNECTED',
            isEnabled: true,
            phoneNumber: cleanNumber,
            baileysQrCode: null,
            connectedAt: new Date(),
            lastSyncedAt: new Date()
          }
        }).catch(err => console.error('[Baileys DB Error] actualizando conexión:', err.message));
      }

      // 3. Conexión cerrada o desconectada
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`⚠️ [Baileys] Conexión cerrada para ${businessId}. Razón: ${statusCode}, Reconectar: ${shouldReconnect}`);

        if (shouldReconnect) {
          session.status = 'CONNECTING';
          setTimeout(() => {
            startSession(businessId, true);
          }, 4000);
        } else {
          session.status = 'DISCONNECTED';
          session.sock = null;
          session.qr = null;
          session.qrDataUrl = null;

          // Borrar credenciales para permitir nuevo emparejamiento limpio
          try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
          } catch (rmErr) {
            console.error('[Baileys] Error al limpiar directorio de sesión:', rmErr.message);
          }

          await prisma.whatsAppIntegration.updateMany({
            where: { businessId },
            data: {
              connectionStatus: 'DISCONNECTED',
              baileysQrCode: null,
              lastSyncedAt: new Date()
            }
          }).catch(err => console.error('[Baileys DB Error] actualizando desconexión:', err.message));
        }
      }
    });

    // 4. Recepción de mensajes entrantes para el bot de reservas
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.buttonsResponseMessage?.selectedButtonId ||
          msg.message.listResponseMessage?.singleSelectReply?.selectedRowId;

        if (!text) continue;

        const jid = msg.key.remoteJid;
        if (!jid || jid.endsWith('@g.us')) continue; // Ignorar grupos

        const from = jid.split('@')[0];
        const senderName = msg.pushName || 'Cliente WhatsApp';

        console.log(`📩 [Baileys] Mensaje entrante [${businessId}] de ${from} (${senderName}): "${text}"`);

        // Disparar Webhook hacia Next.js
        try {
          const webhookTarget = `${WEBHOOK_URL.replace(/\/+$/, '')}/api/webhooks/whatsapp`;
          const resp = await fetch(webhookTarget, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'BAILEYS',
              businessId,
              from,
              text,
              messageId: msg.key.id,
              senderName
            })
          });

          if (!resp.ok) {
            console.warn(`[Baileys Webhook] Código HTTP ${resp.status} al reenviar mensaje a ${webhookTarget}`);
          }
        } catch (hookErr) {
          console.error('[Baileys Webhook Error]:', hookErr.message);
        }
      }
    });

    return session;
  } catch (err) {
    console.error(`[Baileys] Error al iniciar sesión para ${businessId}:`, err);
    session.status = 'DISCONNECTED';
    return session;
  }
}

/**
 * Espera hasta que el QR esté disponible o se conecte (máximo timeout)
 */
function waitForQrOrConnect(session, timeoutMs = 7000) {
  return new Promise((resolve) => {
    if (session.status === 'CONNECTED' || (session.status === 'QR_READY' && session.qrDataUrl)) {
      return resolve({
        status: session.status,
        qr: session.qr,
        qrDataUrl: session.qrDataUrl,
        phoneNumber: session.phoneNumber
      });
    }

    const timer = setTimeout(() => {
      resolve({
        status: session.status,
        qr: session.qr,
        qrDataUrl: session.qrDataUrl,
        phoneNumber: session.phoneNumber
      });
    }, timeoutMs);

    session.qrWaiters.push((result) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

/**
 * Envío de mensajes de texto por Baileys
 */
async function sendMessage({ businessId, to, text }) {
  let targetBusinessId = businessId;

  if (!targetBusinessId) {
    // Si no se especifica, usar la primera sesión conectada
    for (const [id, s] of sessions.entries()) {
      if (s.status === 'CONNECTED' && s.sock) {
        targetBusinessId = id;
        break;
      }
    }
  }

  if (!targetBusinessId) {
    throw new Error('No hay ninguna sesión activa de WhatsApp');
  }

  const session = sessions.get(targetBusinessId);
  if (!session || !session.sock || session.status !== 'CONNECTED') {
    throw new Error(`La sesión de WhatsApp para ${targetBusinessId} no está conectada`);
  }

  const cleanTo = to.replace(/\D/g, '');
  const jid = `${cleanTo}@s.whatsapp.net`;

  const sent = await session.sock.sendMessage(jid, { text });
  console.log(`📤 [Baileys] Mensaje enviado exitosamente a ${cleanTo} (ID: ${sent?.key?.id})`);

  return {
    success: true,
    messageId: sent?.key?.id || `baileys_${Date.now()}`
  };
}

/**
 * Desconectar y borrar sesión
 */
async function disconnectSession(businessId) {
  const session = sessions.get(businessId);
  if (session && session.sock) {
    try {
      await session.sock.logout().catch(() => {});
      session.sock.end(undefined);
    } catch (e) {
      // Ignorar errores en desconexión
    }
  }

  const sessionDir = path.join(SESSIONS_BASE_DIR, businessId);
  try {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  } catch (e) {}

  sessions.delete(businessId);

  await prisma.whatsAppIntegration.updateMany({
    where: { businessId },
    data: {
      connectionStatus: 'DISCONNECTED',
      baileysQrCode: null,
      lastSyncedAt: new Date()
    }
  }).catch(() => {});

  return { success: true };
}

/**
 * Servidor HTTP de la API de Baileys
 */
const server = http.createServer(async (req, res) => {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // ── GET /health
  if (req.method === 'GET' && pathname === '/health') {
    return sendJson(200, {
      status: 'ok',
      uptime: process.uptime(),
      activeSessions: Array.from(sessions.keys()).map((id) => ({
        businessId: id,
        status: sessions.get(id).status,
        phoneNumber: sessions.get(id).phoneNumber
      }))
    });
  }

  // ── GET /api/qr?businessId=...
  if (req.method === 'GET' && pathname === '/api/qr') {
    const businessId = query.businessId;
    if (!businessId) {
      return sendJson(400, { success: false, error: 'Falta businessId en la consulta' });
    }

    try {
      const session = await startSession(businessId);
      const result = await waitForQrOrConnect(session);

      return sendJson(200, {
        success: true,
        businessId,
        status: result.status,
        qrString: result.qr,
        qrCodeDataUrl: result.qrDataUrl,
        phoneNumber: result.phoneNumber
      });
    } catch (err) {
      console.error('Error procesando GET /api/qr:', err);
      return sendJson(500, { success: false, error: err.message });
    }
  }

  // ── GET /api/status?businessId=...
  if (req.method === 'GET' && pathname === '/api/status') {
    const businessId = query.businessId;
    if (!businessId) {
      return sendJson(400, { success: false, error: 'Falta businessId en la consulta' });
    }

    const session = sessions.get(businessId);
    if (!session) {
      return sendJson(200, {
        success: true,
        businessId,
        status: 'DISCONNECTED',
        phoneNumber: null
      });
    }

    return sendJson(200, {
      success: true,
      businessId,
      status: session.status,
      qrString: session.qr,
      qrCodeDataUrl: session.qrDataUrl,
      phoneNumber: session.phoneNumber
    });
  }

  // ── POST /api/send-message
  if (req.method === 'POST' && pathname === '/api/send-message') {
    let bodyStr = '';
    req.on('data', (chunk) => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const { businessId, sessionId, to, text } = body;
        const targetBiz = businessId || (sessionId && sessionId.startsWith('barberos_') ? sessionId.split('_')[1] : sessionId);

        if (!to || !text) {
          return sendJson(400, { success: false, error: 'Faltan parámetros to o text' });
        }

        const sentResult = await sendMessage({
          businessId: targetBiz,
          to,
          text
        });

        return sendJson(200, sentResult);
      } catch (err) {
        console.error('Error enviando mensaje en /api/send-message:', err);
        return sendJson(500, { success: false, error: err.message });
      }
    });
    return;
  }

  // ── POST /api/disconnect
  if (req.method === 'POST' && (pathname === '/api/disconnect' || pathname === '/api/logout')) {
    let bodyStr = '';
    req.on('data', (chunk) => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const businessId = body.businessId;
        if (!businessId) {
          return sendJson(400, { success: false, error: 'Falta businessId' });
        }

        await disconnectSession(businessId);
        return sendJson(200, { success: true, message: 'Sesión desconectada exitosamente' });
      } catch (err) {
        return sendJson(500, { success: false, error: err.message });
      }
    });
    return;
  }

  return sendJson(404, { error: 'Ruta no encontrada' });
});

server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 [Baileys WhatsApp Service] Ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Webhook Next.js configurado en: ${WEBHOOK_URL}`);
  console.log(`📂 Directorio de autenticación: ${SESSIONS_BASE_DIR}`);
  console.log(`====================================================`);

  // Auto-reanudar sesiones previamente conectadas en la base de datos
  try {
    const activeIntegrations = await prisma.whatsAppIntegration.findMany({
      where: {
        provider: 'BAILEYS',
        connectionStatus: 'CONNECTED'
      }
    });

    if (activeIntegrations.length > 0) {
      console.log(`🔄 Reanudando ${activeIntegrations.length} sesión(es) previa(s) de Baileys...`);
      for (const item of activeIntegrations) {
        startSession(item.businessId).catch((e) => console.error(`Error reanudando ${item.businessId}:`, e.message));
      }
    }
  } catch (err) {
    console.error('Aviso: No se pudo verificar integraciones previas al arrancar:', err.message);
  }
});
