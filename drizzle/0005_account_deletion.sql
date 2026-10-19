ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS user_uploads (file_key text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at timestamp NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS deletion_assets (user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, file_key text NOT NULL, cleaned_at timestamp, PRIMARY KEY(user_id,file_key));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS processing_leases (id uuid PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamp NOT NULL);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION require_active_account() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id text; actor_id text; disabled_at timestamp;
BEGIN
 actor_id := to_jsonb(NEW)->>'user_id';
 IF TG_TABLE_NAME = 'messages' THEN actor_id := NEW.sender_id; END IF;
 IF actor_id IS NOT NULL THEN
  SELECT deletion_requested_at INTO disabled_at FROM users WHERE id=actor_id FOR SHARE;
  IF NOT FOUND OR disabled_at IS NOT NULL THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='23503'; END IF;
 END IF;
 IF TG_TABLE_NAME IN ('messages','notes') THEN
  SELECT user_id INTO owner_id FROM chats WHERE id=(to_jsonb(NEW)->>'chat_id')::uuid;
 ELSIF TG_TABLE_NAME = 'comparison_messages' THEN
  SELECT user_id INTO owner_id FROM comparisons WHERE id=NEW.comparison_id;
 END IF;
 IF owner_id IS NOT NULL THEN
  SELECT deletion_requested_at INTO disabled_at FROM users WHERE id=owner_id FOR SHARE;
  IF NOT FOUND OR disabled_at IS NOT NULL THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='23503'; END IF;
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chats_account_fk') THEN ALTER TABLE chats ADD CONSTRAINT chats_account_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID; END IF; END $$;
--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='folders_account_fk') THEN ALTER TABLE folders ADD CONSTRAINT folders_account_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID; END IF; END $$;
--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='comparisons_account_fk') THEN ALTER TABLE comparisons ADD CONSTRAINT comparisons_account_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID; END IF; END $$;
--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notes_account_fk') THEN ALTER TABLE notes ADD CONSTRAINT notes_account_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID; END IF; END $$;
--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_subscriptions_account_fk') THEN ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_account_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID; END IF; END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON chats;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON folders;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON comparisons;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON comparisons FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON notes;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON user_subscriptions;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON messages;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON comparison_messages;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON comparison_messages FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON activity_visits;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON activity_visits FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON model_usage;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON model_usage FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON daily_activity;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON daily_activity FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON daily_activity_ist;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON daily_activity_ist FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON user_uploads;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON user_uploads FOR EACH ROW EXECUTE FUNCTION require_active_account();
--> statement-breakpoint
DROP TRIGGER IF EXISTS active_account_guard ON processing_leases;
--> statement-breakpoint
CREATE TRIGGER active_account_guard BEFORE INSERT OR UPDATE ON processing_leases FOR EACH ROW EXECUTE FUNCTION require_active_account();
