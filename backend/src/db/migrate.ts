import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config.js';

export function initializeDatabase(): Database.Database {
  // Ensure directories exist
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const baileysDir = path.dirname(config.baileysAuthPath);
  if (!fs.existsSync(baileysDir)) {
    fs.mkdirSync(baileysDir, { recursive: true });
  }

  const uploadsDir = path.resolve(config.uploadsDir);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const db = new Database(config.dbPath);
  
  // Run schema
  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schemaSQL);
  
  console.log('[DB] Database initialized at:', config.dbPath);
  return db;
}
