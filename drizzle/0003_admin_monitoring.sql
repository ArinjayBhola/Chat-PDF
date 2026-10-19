CREATE TABLE IF NOT EXISTS daily_activity (user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date, PRIMARY KEY(user_id,day));
INSERT INTO daily_activity(user_id,day) SELECT DISTINCT user_id,created_at::date FROM activity_visits ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS provider_errors (id uuid PRIMARY KEY, provider text NOT NULL, model text NOT NULL, feature text NOT NULL, category text NOT NULL, created_at timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS provider_errors_created_idx ON provider_errors(created_at);
CREATE TABLE IF NOT EXISTS admin_access_logs (id uuid PRIMARY KEY, actor_id text, outcome text NOT NULL, action text NOT NULL, created_at timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS admin_access_logs_created_idx ON admin_access_logs(created_at);
