import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

let db: ReturnType<typeof import('better-sqlite3')>;

function getDB() {
  return db;
}

export function initAuthRoutes(database: ReturnType<typeof import('better-sqlite3')>) {
  db = database;
  const router = Router();
  
  // POST /api/auth/login
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password wajib diisi' });
      return;
    }
    
    const staff = db.prepare(`SELECT * FROM staff WHERE username = ?`).get(username) as any;
    if (!staff) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }
    
    bcrypt.compare(password, staff.password_hash, (err, match) => {
      if (err || !match) {
        res.status(401).json({ error: 'Username atau password salah' });
        return;
      }
      
      const token = jwt.sign(
        { id: staff.id, username: staff.username, displayName: staff.display_name },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      
      // Update status online
      db.prepare("UPDATE staff SET status = 'online' WHERE id = ?").run(staff.id);
      
      res.json({
        token,
        staff: {
          id: staff.id,
          username: staff.username,
          displayName: staff.display_name,
          avatarUrl: staff.avatar_url,
          status: 'online',
        },
      });
    });
  });
  
  // POST /api/auth/logout
  router.post('/logout', (req, res) => {
    const auth = req.headers.authorization;
    // In production: add token blacklist/check here
    res.json({ message: 'Logged out successfully' });
  });
  
  return router;
}
