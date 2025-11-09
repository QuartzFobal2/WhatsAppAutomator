// Database wrapper for CommonJS Electron environment
const Database = require('better-sqlite3');
const path = require('path');

let db = null;

function initDatabase(userDataPath) {
  const dbPath = path.join(userDataPath, 'whatsapp-automation.db');
  db = new Database(dbPath);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_sets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      messages TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id TEXT PRIMARY KEY,
      contact_ids TEXT NOT NULL,
      messages TEXT NOT NULL,
      scheduled_time INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_time INTEGER,
      error TEXT,
      results TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS send_logs (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      message_set_id TEXT,
      status TEXT NOT NULL,
      error TEXT,
      sent_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_messages(status, scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_send_logs_contact ON send_logs(contact_id, sent_at);
  `);
  
  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}

// Message Sets Operations
function saveMessageSet(id, name, messages) {
  const database = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  
  const stmt = database.prepare(`
    INSERT INTO message_sets (id, name, messages, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      messages = excluded.messages,
      updated_at = excluded.updated_at
  `);
  
  stmt.run(id, name, JSON.stringify(messages), now, now);
}

function getAllMessageSets() {
  const database = getDatabase();
  const stmt = database.prepare('SELECT * FROM message_sets ORDER BY updated_at DESC');
  const sets = stmt.all();
  
  return sets.map((set) => ({
    id: set.id,
    name: set.name,
    messages: JSON.parse(set.messages),
    createdAt: new Date(set.created_at * 1000),
    updatedAt: new Date(set.updated_at * 1000),
  }));
}

function deleteMessageSet(id) {
  const database = getDatabase();
  const stmt = database.prepare('DELETE FROM message_sets WHERE id = ?');
  stmt.run(id);
}

// Scheduled Messages Operations
function saveScheduledMessage(data) {
  const database = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  
  const stmt = database.prepare(`
    INSERT INTO scheduled_messages (
      id, contact_ids, messages, scheduled_time, status, sent_time, error, results, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      sent_time = excluded.sent_time,
      error = excluded.error,
      results = excluded.results
  `);
  
  stmt.run(
    data.id,
    JSON.stringify(data.contactIds),
    JSON.stringify(data.messages),
    Math.floor(data.scheduledTime.getTime() / 1000),
    data.status,
    data.sentTime ? Math.floor(data.sentTime.getTime() / 1000) : null,
    data.error || null,
    data.results ? JSON.stringify(data.results) : null,
    data.createdAt ? Math.floor(data.createdAt.getTime() / 1000) : now
  );
}

function getAllScheduledMessages() {
  const database = getDatabase();
  const stmt = database.prepare('SELECT * FROM scheduled_messages ORDER BY scheduled_time DESC');
  const messages = stmt.all();
  
  return messages.map((msg) => ({
    id: msg.id,
    contactIds: JSON.parse(msg.contact_ids),
    messages: JSON.parse(msg.messages),
    scheduledTime: new Date(msg.scheduled_time * 1000),
    status: msg.status,
    sentTime: msg.sent_time ? new Date(msg.sent_time * 1000) : null,
    error: msg.error,
    results: msg.results ? JSON.parse(msg.results) : undefined,
    createdAt: new Date(msg.created_at * 1000),
  }));
}

function deleteScheduledMessage(id) {
  const database = getDatabase();
  const stmt = database.prepare('DELETE FROM scheduled_messages WHERE id = ?');
  stmt.run(id);
}

function clearCompletedScheduledMessages() {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM scheduled_messages WHERE status != 'pending'");
  stmt.run();
}

// Send Logs Operations
function saveSendLog(id, contactId, messageSetId, status, error) {
  const database = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  
  const stmt = database.prepare(`
    INSERT INTO send_logs (id, contact_id, message_set_id, status, error, sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, contactId, messageSetId || null, status, error || null, now);
}

// Settings Operations
function getSetting(key, defaultValue = null) {
  const database = getDatabase();
  const stmt = database.prepare('SELECT value FROM app_settings WHERE key = ?');
  const result = stmt.get(key);
  
  if (!result) return defaultValue;
  
  try {
    return JSON.parse(result.value);
  } catch {
    return result.value;
  }
}

function setSetting(key, value) {
  const database = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  
  const stmt = database.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);
  
  const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
  stmt.run(key, valueStr, now);
}

module.exports = {
  initDatabase,
  getDatabase,
  saveMessageSet,
  getAllMessageSets,
  deleteMessageSet,
  saveScheduledMessage,
  getAllScheduledMessages,
  deleteScheduledMessage,
  clearCompletedScheduledMessages,
  saveSendLog,
  getSetting,
  setSetting,
};
