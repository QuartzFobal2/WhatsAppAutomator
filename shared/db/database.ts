import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import path from 'path';

let db: ReturnType<typeof drizzle> | null = null;

export function initDatabase(userDataPath: string) {
  const dbPath = path.join(userDataPath, 'whatsapp-automation.db');
  const sqlite = new Database(dbPath);
  
  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');
  
  db = drizzle(sqlite, { schema });
  
  // Initialize tables
  sqlite.exec(`
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
  `);
  
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}

// Message Sets Operations
export async function saveMessageSet(id: string, name: string, messages: any[]) {
  const database = getDatabase();
  const now = new Date();
  
  await database.insert(schema.messageSets).values({
    id,
    name,
    messages: JSON.stringify(messages),
    createdAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: schema.messageSets.id,
    set: {
      name,
      messages: JSON.stringify(messages),
      updatedAt: now,
    },
  });
}

export async function getAllMessageSets() {
  const database = getDatabase();
  const sets = await database.select().from(schema.messageSets).all();
  return sets.map((set) => ({
    ...set,
    messages: JSON.parse(set.messages),
  }));
}

export async function deleteMessageSet(id: string) {
  const database = getDatabase();
  await database.delete(schema.messageSets).where(eq(schema.messageSets.id, id));
}

// Scheduled Messages Operations
export async function saveScheduledMessage(data: any) {
  const database = getDatabase();
  await database.insert(schema.scheduledMessages).values({
    ...data,
    contactIds: JSON.stringify(data.contactIds),
    messages: JSON.stringify(data.messages),
    results: data.results ? JSON.stringify(data.results) : null,
  }).onConflictDoUpdate({
    target: schema.scheduledMessages.id,
    set: {
      status: data.status,
      sentTime: data.sentTime,
      error: data.error,
      results: data.results ? JSON.stringify(data.results) : null,
    },
  });
}

export async function getAllScheduledMessages() {
  const database = getDatabase();
  const messages = await database.select().from(schema.scheduledMessages).all();
  return messages.map((msg) => ({
    ...msg,
    contactIds: JSON.parse(msg.contactIds),
    messages: JSON.parse(msg.messages),
    results: msg.results ? JSON.parse(msg.results) : undefined,
  }));
}

export async function deleteScheduledMessage(id: string) {
  const database = getDatabase();
  await database.delete(schema.scheduledMessages).where(eq(schema.scheduledMessages.id, id));
}

// Send Logs Operations
export async function saveSendLog(id: string, contactId: string, messageSetId: string | undefined, status: string, error?: string) {
  const database = getDatabase();
  await database.insert(schema.sendLogs).values({
    id,
    contactId,
    messageSetId: messageSetId || null,
    status,
    error: error || null,
    sentAt: new Date(),
  });
}
