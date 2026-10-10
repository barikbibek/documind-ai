import {
  pgTable, uuid, text, integer, index,
  jsonb, timestamp, customType
} from 'drizzle-orm/pg-core';

// pgvector is not a native Drizzle type so we define it manually.
// toDriver converts number[] → "[0.1,0.2,...]" string (what pgvector expects)
// fromDriver converts that string back to number[]
const vector = (name: string, dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() { return `vector(${dimensions})`; },
    toDriver(value: number[]) { return `[${value.join(',')}]`; },
    fromDriver(value: string) {
      return value.slice(1, -1).split(',').map(Number);
    },
  })(name);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('New Chat'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [index('chat_sessions_user_updated_idx').on(table.userId, table.updatedAt)]);

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  fileSize: integer('file_size').notNull(),
  status: text('status').notNull().default('pending'),
  pageCount: integer('page_count'),
  errorMsg: text('error_msg'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [index('documents_session_created_idx').on(table.sessionId, table.createdAt)]);

export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: vector('embedding', 3072),
  chunkIndex: integer('chunk_index').notNull(),
  pageNumber: integer('page_number'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [index('document_chunks_session_idx').on(table.sessionId)]);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  sources: jsonb('sources').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [index('messages_session_created_idx').on(table.sessionId, table.createdAt)]);

// Retained independently of chats and documents so clearing either cannot reset a daily allowance.
export const usageEvents = pgTable('usage_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('usage_events_user_kind_created_idx').on(table.userId, table.kind, table.createdAt)]);
