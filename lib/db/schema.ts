import { pgTable, text, timestamp, pgEnum, uuid, index } from "drizzle-orm/pg-core";

// Export auth schema
export * from "./auth-schema";

export const userSystemEnum = pgEnum("user_system_enum", ["system", "user"]);

export const folders = pgTable("folders", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("folders_user_id_idx").on(table.userId),
  createdAtIdx: index("folders_created_at_idx").on(table.createdAt),
}));

export type DrizzleFolder = typeof folders.$inferSelect;

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey(),
  fileName: text("pdf_name").notNull(),
  fileUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id").notNull(),
  fileKey: text("file_key").notNull(),
  pdfStatus: text("pdf_status").notNull().default("SUCCESS"), // 'PROCESSING' | 'SUCCESS' | 'FAILED'
  isShared: text("is_shared").notNull().default("false"), // Using text for boolean-like compatibility if needed, or boolean if preferred.
  shareToken: text("share_token").unique(),
  sharePermission: text("share_permission").notNull().default("view"), // 'view' | 'edit'
  allowPublicView: text("allow_public_view").notNull().default("false"),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  isPinned: text("is_pinned").notNull().default("false"),
}, (table) => ({
  userIdIdx: index("chats_user_id_idx").on(table.userId),
  createdAtIdx: index("chats_created_at_idx").on(table.createdAt),
  folderIdIdx: index("chats_folder_id_idx").on(table.folderId),
}));

export type DrizzleChat = typeof chats.$inferSelect;

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey(),
  chatsId: uuid("chat_id")
    .references(() => chats.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  role: userSystemEnum("role").notNull(),
  senderId: text("sender_id"),
  senderName: text("sender_name"),
}, (table) => ({
  chatIdIdx: index("messages_chat_id_idx").on(table.chatsId),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id)
    .notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index("notes_chat_id_idx").on(table.chatId),
  userIdIdx: index("notes_user_id_idx").on(table.userId),
  createdAtIdx: index("notes_created_at_idx").on(table.createdAt),
}));

export type DrizzleNote = typeof notes.$inferSelect;

export const comparisons = pgTable("comparisons", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),
  chatIdsKey: text("chat_ids_key").notNull(), // sorted comma-separated chat IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("comparisons_user_id_idx").on(table.userId),
  createdAtIdx: index("comparisons_created_at_idx").on(table.createdAt),
}));

export type DrizzleComparison = typeof comparisons.$inferSelect;

export const comparisonMessages = pgTable("comparison_messages", {
  id: uuid("id").primaryKey(),
  comparisonId: uuid("comparison_id")
    .references(() => comparisons.id)
    .notNull(),
  content: text("content").notNull(),
  role: userSystemEnum("role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  comparisonIdIdx: index("comparison_messages_id_idx").on(table.comparisonId),
  createdAtIdx: index("comparison_messages_created_at_idx").on(table.createdAt),
}));

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  dodoPaymentId: text("dodo_payment_id"),
  dodoSubscriptionId: text("dodo_subscription_id"),
  dodoCustomerId: text("dodo_customer_id"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  status: text("status").default("active"),
}, (table) => ({
  userIdIdx: index("user_subscriptions_user_id_idx").on(table.userId),
}));
