import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageUpsertType,
  proto,
  useMultiFileAuthState,
  WAMessageKey,
} from '@whiskeysockets/baileys';
import { config } from '../config.js';
import P from 'pino';

let socket: ReturnType<typeof makeWASocket> | null = null;
let isConnecting = false;

export type OnMessageHandler = (msg: proto.IWebMessageInfo) => void | Promise<void>;
let onMessageHandler: OnMessageHandler | null = null;

export function registerOnMessage(handler: OnMessageHandler) {
  onMessageHandler = handler;
}

/** Connect to WhatsApp via Baileys multi-device */
export async function connectWhatsApp(): Promise<typeof socket> {
  if (socket && !isConnecting) return socket;
  if (isConnecting) return socket;
  
  isConnecting = true;
  console.log('[WA] Connecting...');
  
  const { state, saveCreds } = await useMultiFileAuthState(config.baileysAuthPath);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`[WA] Using WA version: ${version.join('.')}, latest: ${isLatest}`);
  
  socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: 'warn' }),
    browser: ['DENTANET HelpDesk', 'Chrome', '1.0.0'],
    getMessage: async (key) => {
      // For retry payment receipt - not needed for helpdesk
      return undefined;
    },
  });
  
  socket.ev.on('creds.update', saveCreds);
  
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 SCAN QR CODE IN WHATSAPP');
      console.log('   Settings → Linked Devices → Link a Device');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    if (connection === 'close') {
      const reason = (lastDisconnect?.error as any)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log('[WA] Logged out. Re-auth required.');
        socket = null;
        isConnecting = false;
        return;
      }
      // Reconnect on other errors
      console.log('[WA] Connection closed, reconnecting...');
      setTimeout(() => connectWhatsApp(), 3000);
    } else if (connection === 'open') {
      console.log('[WA] ✅ Connected! Nomor siap menerima pesan.');
      isConnecting = false;
    }
  });
  
  socket.ev.on('messages.upsert', async (m) => {
    if (onMessageHandler && m.messages.length > 0) {
      const msg = m.messages[0];
      try {
        await onMessageHandler(msg);
      } catch (err) {
        console.error('[WA] Error handling message:', err);
      }
    }
  });
  
  return socket;
}

/** Get current socket instance */
export function getSocket() {
  return socket;
}

/** Send text message via WhatsApp */
export async function sendText(to: string, text: string): Promise<boolean> {
  if (!socket) {
    console.error('[WA] Socket not connected');
    return false;
  }
  try {
    await socket.sendMessage(to, { text });
    return true;
  } catch (err) {
    console.error('[WA] Send failed:', err);
    return false;
  }
}
