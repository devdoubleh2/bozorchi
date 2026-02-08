-- Create telegram_sessions table for storing Telegram bot authentication
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chat_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT telegram_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS telegram_sessions_user_id_idx ON telegram_sessions(user_id);
CREATE INDEX IF NOT EXISTS telegram_sessions_chat_id_idx ON telegram_sessions(chat_id);
