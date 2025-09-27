ALTER TABLE repo_commits ADD COLUMN seq INTEGER;
ALTER TABLE repo_commits ADD COLUMN did TEXT;
ALTER TABLE repo_commits ADD COLUMN event_time TEXT;
ALTER TABLE repo_commits ADD COLUMN car BLOB;
ALTER TABLE repo_commits ADD COLUMN frame BLOB;
ALTER TABLE repo_commits ADD COLUMN too_big INTEGER DEFAULT 0;
UPDATE repo_commits SET seq = COALESCE(seq, rowid);
CREATE UNIQUE INDEX IF NOT EXISTS repo_commits_seq_idx ON repo_commits(seq);
CREATE INDEX IF NOT EXISTS repo_commits_rev_idx ON repo_commits(rev);
