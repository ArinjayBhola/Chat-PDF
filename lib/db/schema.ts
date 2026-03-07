import { pgTable, text, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";

// Export auth schema
export * from "./auth-schema";

export const userSystemEnum = pgEnum("user_system_enum", ["system", "user"]);

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey(),
  fileName: text("pdf_name").notNull(),
  fileUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id").notNull(),
  fileKey: text("file_key").notNull(),
  isShared: text("is_shared").notNull().default("false"), // Using text for boolean-like compatibility if needed, or boolean if preferred.
  shareToken: text("share_token").unique(),
  sharePermission: text("share_permission").notNull().default("view"), // 'view' | 'edit'
  allowPublicView: text("allow_public_view").notNull().default("false"),
});

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
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id)
    .notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DrizzleNote = typeof notes.$inferSelect;

export const comparisons = pgTable("comparisons", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),
  chatIdsKey: text("chat_ids_key").notNull(), // sorted comma-separated chat IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DrizzleComparison = typeof comparisons.$inferSelect;

export const comparisonMessages = pgTable("comparison_messages", {
  id: uuid("id").primaryKey(),
  comparisonId: uuid("comparison_id")
    .references(() => comparisons.id)
    .notNull(),
  content: text("content").notNull(),
  role: userSystemEnum("role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpayPaymentLinkId: text("razorpay_payment_link_id"),
  razorpayPaymentLinkStatus: text("razorpay_payment_link_status"),
  razorpaySignature: text("razorpay_signature"),
  subscriptionEndDate: timestamp("subscription_end_date"),
});
