import { pgTable, text, timestamp, primaryKey, integer } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // For credentials provider
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const otps = pgTable("otps", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  type: text("type").notNull(), // 'verification' or 'reset'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
