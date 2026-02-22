CREATE TYPE "public"."user_system_enum" AS ENUM('system', 'user');--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pdf_name" text NOT NULL,
	"pdf_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"file_key" text NOT NULL,
	"summary" text,
	"suggested_questions" text[],
	"is_shared" text DEFAULT 'false' NOT NULL,
	"share_token" text,
	"share_permission" text DEFAULT 'view' NOT NULL,
	"allow_public_view" text DEFAULT 'false' NOT NULL,
	CONSTRAINT "chats_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"role" "user_system_enum" NOT NULL,
	"sender_id" text,
	"sender_name" text
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"razorpay_payment_id" text,
	"razorpay_payment_link_id" text,
	"razorpay_payment_link_status" text,
	"razorpay_signature" text,
	"subscription_end_date" timestamp,
	CONSTRAINT "user_subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"otp" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;