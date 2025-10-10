-- Rawkode Studio D1 schema v1
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  atproto_did TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS shows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  name TEXT NOT NULL,
  config_json TEXT NOT NULL,
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (show_id) REFERENCES shows(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rtk_session_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ended_at TEXT,
  FOREIGN KEY (show_id) REFERENCES shows(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  owner_session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  rtk_track_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ended_at TEXT,
  FOREIGN KEY (show_id) REFERENCES shows(id),
  FOREIGN KEY (owner_session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS program_recordings (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  status TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

CREATE TABLE IF NOT EXISTS iso_manifests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  show_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  status TEXT NOT NULL,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  total_parts INTEGER NOT NULL DEFAULT 0,
  hash TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

CREATE TABLE IF NOT EXISTS iso_parts (
  id TEXT PRIMARY KEY,
  manifest_id TEXT NOT NULL,
  part_no INTEGER NOT NULL,
  bytes INTEGER NOT NULL,
  hash TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (manifest_id) REFERENCES iso_manifests(id)
);

CREATE TABLE IF NOT EXISTS raise_hands (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (show_id) REFERENCES shows(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  question TEXT NOT NULL,
  options_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  option_idx INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (poll_id) REFERENCES polls(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_show_id ON sessions(show_id);
CREATE INDEX IF NOT EXISTS idx_tracks_show_id ON tracks(show_id);
CREATE INDEX IF NOT EXISTS idx_iso_manifests_show_id ON iso_manifests(show_id);
CREATE INDEX IF NOT EXISTS idx_iso_parts_manifest_id ON iso_parts(manifest_id);
CREATE INDEX IF NOT EXISTS idx_raise_hands_show_id ON raise_hands(show_id);
CREATE INDEX IF NOT EXISTS idx_polls_show_id ON polls(show_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);

