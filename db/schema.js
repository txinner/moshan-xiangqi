import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{
  code:text('code').primaryKey(),hostHash:text('host_hash').notNull(),guestHash:text('guest_hash'),
  state:text('state').notNull(),version:integer('version').notNull().default(0),
  updatedAt:integer('updated_at').notNull(),expiresAt:integer('expires_at').notNull(),
});
