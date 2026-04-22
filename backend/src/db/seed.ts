import { initializeDatabase } from './migrate.js';
import bcrypt from 'bcrypt';
import * as fs from 'fs';

export async function seedDefaultAdmin() {
  const db = initializeDatabase();
  
  // Check if admin already exists
  const existing = db.prepare("SELECT id FROM staff WHERE username = 'admin'").get();
  if (existing) {
    console.log('[SEED] Admin user already exists, skipping.');
    db.close();
    return;
  }
  
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash('admin123', salt);
  
  db.prepare(`INSERT INTO staff (username, password_hash, display_name, status) VALUES (?, ?, ?, ?)`).run(
    'admin',
    hash,
    'Admin DENTANET',
    'online'
  );
  
  console.log('[SEED] Default admin user created:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('  ** CHANGE PASSWORD AFTER FIRST LOGIN! **');
  
  db.close();
}

seedDefaultAdmin().catch(err => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});
