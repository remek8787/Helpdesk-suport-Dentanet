import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { initializeDatabase } from './db/migrate.js';
import { initAuthRoutes } from './routes/auth.js';
import { initStaffRoutes } from './routes/staff.js';
import { initChatRoutes } from './routes/chat.js';
import { connectWhatsApp, registerOnMessage } from './utils/baileys.js';
import { initSocket } from './ws/socket.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.allowedOrigins,
    credentials: true,
  },
});

const db = initializeDatabase();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(config.uploadsDir)));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'DENTANET Help Desk', time: new Date().toISOString() });
});

app.use('/api/auth', initAuthRoutes(db as any));
app.use('/api/staff', initStaffRoutes(db as any));
app.use('/api/chat', initChatRoutes(db as any, io));

// simple QR status endpoint placeholder
app.get('/api/wa/status', (_req, res) => {
  res.json({ connected: true, note: 'QR real-time endpoint can be extended next' });
});

// Handle incoming WhatsApp messages
registerOnMessage(async (msg: any) => {
  const from = msg?.key?.remoteJid;
  const fromMe = msg?.key?.fromMe;
  if (!from || fromMe) return;

  const text =
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.imageMessage?.caption ||
    msg?.message?.videoMessage?.caption ||
    '';

  const type = msg?.message?.imageMessage
    ? 'image'
    : msg?.message?.videoMessage
    ? 'video'
    : msg?.message?.documentMessage
    ? 'document'
    : msg?.message?.audioMessage
    ? 'audio'
    : 'text';

  let customer = db.prepare(`SELECT * FROM customers WHERE wa_id = ?`).get(from) as any;
  if (!customer) {
    const r = db.prepare(`INSERT INTO customers (wa_id, name, last_message_at, created_at) VALUES (?, ?, datetime('now'), datetime('now'))`).run(from, '');
    customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(r.lastInsertRowid as number);
  } else {
    db.prepare(`UPDATE customers SET last_message_at = datetime('now') WHERE id = ?`).run(customer.id);
  }

  const result = db.prepare(`
    INSERT INTO messages (customer_id, sender_type, content, message_type, direction, status, timestamp)
    VALUES (?, 'customer', ?, ?, 'inbound', 'delivered', datetime('now'))
  `).run(customer.id, text || '<media>', type);

  const saved = db.prepare(`SELECT * FROM messages WHERE id = ?`).get(result.lastInsertRowid as number) as any;
  io.emit('message:new', { ...(saved || {}), customer });
  io.emit('conversation:update', { customerId: customer.id, lastMessageAt: new Date().toISOString() });
});

initSocket(io, db);

// Serve frontend build if exists
const frontendBuild = path.resolve(process.cwd(), config.frontendBuildDir);
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

server.listen(config.port, async () => {
  console.log(`[APP] DENTANET Help Desk running on :${config.port}`);
  await connectWhatsApp();
});
