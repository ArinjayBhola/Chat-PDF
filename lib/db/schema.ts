import { pgTable, text, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";

// Export auth schema
export * from "./auth-schema";

export const userSystemEnum = pgEnum("user_system_enum", ["system", "user"]);

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey(),
  pdfName: text("pdf_name").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id").notNull(), // Changed from varchar to text to match users.id
  fileKey: text("file_key").notNull(),
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
