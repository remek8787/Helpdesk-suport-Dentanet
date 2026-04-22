-- DENTANET Help Desk Database Schema

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    status TEXT DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'busy')),
    created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wa_id TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    last_message_at DATETIME,
    created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK(sender_type IN ('customer', 'staff')),
    staff_id INTEGER REFERENCES staff(id),
    content TEXT NOT NULL DEFAULT '',
    media_url TEXT,
    message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'video', 'document', 'audio', 'sticker', 'location', 'contact', 'reaction')),
    direction TEXT NOT NULL DEFAULT 'inbound' CHECK(direction IN ('inbound', 'outbound')),
    status TEXT DEFAULT 'delivered' CHECK(status IN ('sent', 'delivered', 'read', 'failed')),
    timestamp DATETIME DEFAULT (datetime('now')),
    INDEX idx_customer_messages (customer_id, timestamp DESC),
    INDEX idx_staff_sent (staff_id, timestamp ASC)
);

CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_customers_waid ON customers(wa_id);
