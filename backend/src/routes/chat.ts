import { Router } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { sendText } from '../utils/baileys.js';

let db: any;
let io: any;

export function initChatRoutes(database: any, socketServer: any) {
  db = database;
  io = socketServer;
  const router = Router();

  router.get('/customers', authenticate, (_req: AuthRequest, res) => {
    const customers = db.prepare(`
      SELECT c.*, (
        SELECT content FROM messages m
        WHERE m.customer_id = c.id
        ORDER BY m.timestamp DESC LIMIT 1
      ) as last_message,
      (
        SELECT direction FROM messages m
        WHERE m.customer_id = c.id
        ORDER BY m.timestamp DESC LIMIT 1
      ) as last_direction
      FROM customers c
      ORDER BY c.last_message_at DESC, c.id DESC
    `).all();

    res.json({ customers });
  });

  router.get('/customers/:id/messages', authenticate, (req: AuthRequest, res) => {
    const { id } = req.params;
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10), 0);

    const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id);
    if (!customer) {
      res.status(404).json({ error: 'Customer tidak ditemukan' });
      return;
    }

    const messages = db.prepare(`
      SELECT m.*, s.display_name as staff_display_name
      FROM messages m
      LEFT JOIN staff s ON s.id = m.staff_id
      WHERE m.customer_id = ?
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

    res.json({ customer, messages: messages.reverse() });
  });

  router.post('/send', authenticate, async (req: AuthRequest, res) => {
    const { customerId, message } = req.body;

    if (!customerId || !message) {
      res.status(400).json({ error: 'customerId dan message wajib diisi' });
      return;
    }

    const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(customerId) as any;
    if (!customer) {
      res.status(404).json({ error: 'Customer tidak ditemukan' });
      return;
    }

    const ok = await sendText(customer.wa_id, message);
    const status = ok ? 'sent' : 'failed';

    const result = db.prepare(`
      INSERT INTO messages (
        customer_id, sender_type, staff_id, content, message_type, direction, status, timestamp
      ) VALUES (?, 'staff', ?, ?, 'text', 'outbound', ?, datetime('now'))
    `).run(customerId, req.staffId, message, status);

    db.prepare(`UPDATE customers SET last_message_at = datetime('now') WHERE id = ?`).run(customerId);

    const saved = db.prepare(`
      SELECT m.*, s.display_name as staff_display_name
      FROM messages m
      LEFT JOIN staff s ON s.id = m.staff_id
      WHERE m.id = ?
    `).get(result.lastInsertRowid as number);

    io.emit('message:new', saved);
    io.emit('conversation:update', { customerId, lastMessageAt: new Date().toISOString() });

    res.json({ success: ok, message: saved });
  });

  return router;
}
