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
  
  // Run schema with multiple fallback paths for dev/build/runtime
  const schemaCandidates = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, 'db', 'schema.sql'),
    path.join(process.cwd(), 'src', 'db', 'schema.sql'),
    path.join(process.cwd(), 'dist', 'db', 'schema.sql'),
  ];
  const schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error(`schema.sql not found. Tried: ${schemaCandidates.join(', ')}`);
  }
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSQL);
  
  console.log('[DB] Database initialized at:', config.dbPath);
  return db;
}
