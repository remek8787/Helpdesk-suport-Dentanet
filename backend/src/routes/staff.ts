import { Router } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest, authenticate } from '../middleware/auth.js';

let db: ReturnType<typeof import('better-sqlite3')>;

export function initStaffRoutes(database: ReturnType<typeof import('better-sqlite3')>) {
  db = database;
  const router = Router();
  
  // GET /api/staff - list all staff (admin only)
  router.get('/', authenticate, (req: AuthRequest, res) => {
    const staffList = db.prepare(`SELECT id, username, display_name, avatar_url, status, created_at FROM staff ORDER BY id`).all();
    res.json({ staff: staffList });
  });
  
  // POST /api/staff - create new staff (admin only)
  router.post('/', authenticate, (req: AuthRequest, res) => {
    if (req.staffUsername !== 'admin') {
      res.status(403).json({ error: 'Hanya admin yang bisa menambah staff' });
      return;
    }
    
    const { username, password, displayName } = req.body;
    if (!username || !password || !displayName) {
      res.status(400).json({ error: 'username, password, dan display_name wajib diisi' });
      return;
    }
    
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);
    
    try {
      const result = db.prepare(
        `INSERT INTO staff (username, password_hash, display_name, status) VALUES (?, ?, ?, 'offline')`
      ).run(username, hash, displayName);
      
      const newStaff = db.prepare("SELECT * FROM staff WHERE id = ?").get(result.lastInsertRowid as number) as any;
      res.status(201).json({ staff: { ...newStaff, password_hash: undefined } });
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        res.status(409).json({ error: 'Username sudah dipakai' });
      } else {
        throw err;
      }
    }
  });
  
  // PUT /api/staff/:id/status - update own status
  router.put('/:id/status', authenticate, (req: AuthRequest, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['online', 'busy'].includes(status)) {
      res.status(400).json({ error: 'Status harus online atau busy' });
      return;
    }
    
    // Staff can only update their own status
    if (String(req.staffId) !== id && req.staffUsername !== 'admin') {
      res.status(403).json({ error: 'Tidak diizinkan' });
      return;
    }
    
    db.prepare("UPDATE staff SET status = ? WHERE id = ?").run(status, id);
    res.json({ message: `Status updated to ${status}` });
  });
  
  return router;
}
