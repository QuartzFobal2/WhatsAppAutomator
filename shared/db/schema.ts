import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Message Sets - Conjuntos de mensagens salvas
export const messageSets = sqliteTable('message_sets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  messages: text('messages').notNull(), // JSON string of MessageItem[]
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Scheduled Messages - Mensagens agendadas
export const scheduledMessages = sqliteTable('scheduled_messages', {
  id: text('id').primaryKey(),
  contactIds: text('contact_ids').notNull(), // JSON array of contact IDs
  messages: text('messages').notNull(), // JSON string of MessageItem[]
  scheduledTime: integer('scheduled_time', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('pending'), // pending, sent, failed, partial
  sentTime: integer('sent_time', { mode: 'timestamp' }),
  error: text('error'),
  results: text('results'), // JSON string of results
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Send Logs - Histórico de envios para auditoria
export const sendLogs = sqliteTable('send_logs', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull(),
  messageSetId: text('message_set_id'),
  status: text('status').notNull(), // success, failed
  error: text('error'),
  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// App Settings - Configurações persistentes
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
