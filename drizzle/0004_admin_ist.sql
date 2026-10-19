-- Preserve old UTC aggregates; record IST activity separately so dates are never relabelled incorrectly.
CREATE TABLE IF NOT EXISTS daily_activity_ist (user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, day date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date, PRIMARY KEY(user_id,day));
-- Historical visits only provide their start timestamp, not every activity instant.
INSERT INTO daily_activity_ist(user_id,day)
SELECT DISTINCT user_id, (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date FROM activity_visits
ON CONFLICT DO NOTHING;
