ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "file_deleted" text DEFAULT 'false' NOT NULL;
