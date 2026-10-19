ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
CREATE TABLE IF NOT EXISTS activity_visits (id uuid PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, route text NOT NULL, active_seconds integer NOT NULL DEFAULT 0 CHECK (active_seconds BETWEEN 0 AND 86400), created_at timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS activity_visits_user_idx ON activity_visits(user_id);
CREATE TABLE IF NOT EXISTS model_usage (id uuid PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, model text NOT NULL, feature text NOT NULL, created_at timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS model_usage_user_idx ON model_usage(user_id);
