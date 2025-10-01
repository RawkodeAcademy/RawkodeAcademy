import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import { CID } from "multiformats/cid";
import {
  BlockMap,
  ReadableBlockstore,
  blocksToCarFile,
  type CommitData,
  type RepoStorage
} from "@atproto/repo";

export interface CommitEventLog {
  repo: string;
  car: Uint8Array;
  frame?: Uint8Array;
  eventTime: string;
  tooBig?: boolean;
  seq?: number;
}

export interface CommitRow {
  seq: number;
  cid: CID;
  rev: string;
  since: string | null;
  prev: CID | null;
  car: Uint8Array | null;
  frame: Uint8Array | null;
  eventTime: string | null;
}

export class D1RepoStorage extends ReadableBlockstore implements RepoStorage {
  constructor(private readonly db: D1Database, private readonly did: string) {
    super();
  }

  private prepare(sql: string, ...binds: unknown[]): D1PreparedStatement {
    const statement = this.db.prepare(sql);
    if (binds.length > 0) {
      return statement.bind(...binds);
    }
    return statement;
  }

  async getRoot(): Promise<CID | null> {
    const row = await this.prepare(
      "SELECT root_cid FROM repo_head WHERE did = ?1",
      this.did
    ).first<{ root_cid: string }>();
    return row?.root_cid ? CID.parse(row.root_cid) : null;
  }

  async getCurrentHead(): Promise<{ cid: CID; rev: string } | null> {
    const row = await this.prepare(
      "SELECT root_cid, rev FROM repo_head WHERE did = ?1",
      this.did
    ).first<{ root_cid: string; rev: string }>();
    if (!row) {
      return null;
    }
    return { cid: CID.parse(row.root_cid), rev: row.rev };
  }

  async putBlock(cid: CID, block: Uint8Array, rev: string): Promise<void> {
    await this.prepare(
      "INSERT OR REPLACE INTO repo_blocks (cid, rev, data) VALUES (?1, ?2, ?3)",
      cid.toString(),
      rev,
      block
    ).run();
  }

  async putMany(blocks: BlockMap, rev: string): Promise<void> {
    if (blocks.size === 0) return;
    const statements: D1PreparedStatement[] = [];
    for (const [cid, bytes] of blocks) {
      statements.push(
        this.prepare(
          "INSERT OR REPLACE INTO repo_blocks (cid, rev, data) VALUES (?1, ?2, ?3)",
          cid.toString(),
          rev,
          bytes
        )
      );
    }
    await this.db.batch(statements);
  }

  async getNextSequence(): Promise<number> {
    const row = await this.prepare(
      "SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM repo_commits WHERE did = ?1 OR did IS NULL",
      this.did
    ).first<{ next_seq: number }>();
    return row?.next_seq ?? 1;
  }

  async updateRoot(cid: CID, rev: string): Promise<void> {
    await this.prepare(
      `INSERT INTO repo_head (did, root_cid, rev) VALUES (?1, ?2, ?3)
       ON CONFLICT(did) DO UPDATE SET root_cid=excluded.root_cid, rev=excluded.rev, updated_at=(strftime('%s','now')*1000)`,
      this.did,
      cid.toString(),
      rev
    ).run();
  }

  async applyCommit(commit: CommitData): Promise<void> {
    const car = await blocksToCarFile(commit.cid, commit.relevantBlocks);
    await this.applyCommitWithEvent(commit, {
      repo: this.did,
      car,
      eventTime: new Date().toISOString()
    });
  }

  async applyCommitWithEvent(
    commit: CommitData,
    log?: CommitEventLog
  ): Promise<number> {
    const statements: D1PreparedStatement[] = [];
    for (const [cid, bytes] of commit.newBlocks) {
      statements.push(
        this.prepare(
          "INSERT OR REPLACE INTO repo_blocks (cid, rev, data) VALUES (?1, ?2, ?3)",
          cid.toString(),
          commit.rev,
          bytes
        )
      );
    }

    for (const removed of commit.removedCids.toList()) {
      statements.push(
        this.prepare("DELETE FROM repo_blocks WHERE cid = ?1", removed.toString())
      );
    }

    const nextSeq =
      log?.seq ??
      ((await this.prepare(
        "SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM repo_commits WHERE did = ?1 OR did IS NULL",
        this.did
      ).first<{ next_seq: number }>())?.next_seq ?? 1);

    const eventTime = log?.eventTime ?? new Date().toISOString();
    const carBuffer = log?.car ? log.car.slice().buffer : null;
    const frameBuffer = log?.frame ? log.frame.slice().buffer : null;
    const tooBig = log?.tooBig ? 1 : 0;

    statements.push(
      this.prepare(
        `INSERT INTO repo_commits (cid, rev, since, prev, did, seq, event_time, car, frame, too_big)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         ON CONFLICT(cid) DO UPDATE SET rev=excluded.rev, since=excluded.since, prev=excluded.prev,
           did=excluded.did, seq=excluded.seq, event_time=excluded.event_time,
           car=COALESCE(excluded.car, repo_commits.car), frame=COALESCE(excluded.frame, repo_commits.frame),
           too_big=excluded.too_big`,
        commit.cid.toString(),
        commit.rev,
        commit.since,
        commit.prev ? commit.prev.toString() : null,
        this.did,
        nextSeq,
        eventTime,
        carBuffer,
        frameBuffer,
        tooBig
      )
    );

    statements.push(
      this.prepare(
        `INSERT INTO repo_head (did, root_cid, rev) VALUES (?1, ?2, ?3)
         ON CONFLICT(did) DO UPDATE SET root_cid=excluded.root_cid, rev=excluded.rev, updated_at=(strftime('%s','now')*1000)`,
        this.did,
        commit.cid.toString(),
        commit.rev
      )
    );

    if (statements.length > 0) {
      await this.db.batch(statements);
    }

    return nextSeq;
  }

  async getBytes(cid: CID): Promise<Uint8Array | null> {
    const row = await this.prepare(
      "SELECT data FROM repo_blocks WHERE cid = ?1",
      cid.toString()
    ).first<{ data: ArrayBuffer }>();
    if (!row) {
      return null;
    }
    return new Uint8Array(row.data);
  }

  async has(cid: CID): Promise<boolean> {
    const row = await this.prepare(
      "SELECT 1 as has_block FROM repo_blocks WHERE cid = ?1",
      cid.toString()
    ).first<{ has_block: number }>();
    return Boolean(row?.has_block);
  }

  async getBlocks(cids: CID[]): Promise<{ blocks: BlockMap; missing: CID[] }> {
    const blocks = new BlockMap();
    const missing: CID[] = [];
    for (const cid of cids) {
      const bytes = await this.getBytes(cid);
      if (bytes) {
        blocks.set(cid, bytes);
      } else {
        missing.push(cid);
      }
    }
    return { blocks, missing };
  }

  async getCommitFramesAfter(seq: number): Promise<Array<{ seq: number; frame: Uint8Array }>> {
    const { results } = await this.prepare(
      `SELECT seq, frame FROM repo_commits WHERE did = ?1 AND frame IS NOT NULL AND seq > ?2 ORDER BY seq ASC`,
      this.did,
      seq
    ).all<{ seq: number; frame: ArrayBuffer | null }>();
    const frames: Array<{ seq: number; frame: Uint8Array }> = [];
    for (const row of results ?? []) {
      if (row.frame) {
        frames.push({ seq: row.seq, frame: new Uint8Array(row.frame) });
      }
    }
    return frames;
  }

  async getCommitRowForRev(rev: string): Promise<CommitRow | null> {
    const row = await this.prepare(
      `SELECT seq, cid, rev, since, prev, car, frame, event_time FROM repo_commits WHERE did = ?1 AND rev = ?2`,
      this.did,
      rev
    ).first<{
      seq: number;
      cid: string;
      rev: string;
      since: string | null;
      prev: string | null;
      car: ArrayBuffer | null;
      frame: ArrayBuffer | null;
      event_time: string | null;
    }>();
    if (!row) {
      return null;
    }
    return this.mapCommitRow(row);
  }

  async getCommitRowsSince(rev?: string): Promise<CommitRow[]> {
    let sinceSeq = 0;
    if (rev) {
      const since = await this.getCommitRowForRev(rev);
      if (!since) {
        return [];
      }
      sinceSeq = since.seq;
    }
    const { results } = await this.prepare(
      `SELECT seq, cid, rev, since, prev, car, frame, event_time FROM repo_commits WHERE did = ?1 AND seq > ?2 ORDER BY seq ASC`,
      this.did,
      sinceSeq
    ).all<{
      seq: number;
      cid: string;
      rev: string;
      since: string | null;
      prev: string | null;
      car: ArrayBuffer | null;
      frame: ArrayBuffer | null;
      event_time: string | null;
    }>();
    return (results ?? []).map((row) => this.mapCommitRow(row));
  }

  private mapCommitRow(row: {
    seq: number;
    cid: string;
    rev: string;
    since: string | null;
    prev: string | null;
    car: ArrayBuffer | null;
    frame: ArrayBuffer | null;
    event_time: string | null;
  }): CommitRow {
    return {
      seq: row.seq,
      cid: CID.parse(row.cid),
      rev: row.rev,
      since: row.since,
      prev: row.prev ? CID.parse(row.prev) : null,
      car: row.car ? new Uint8Array(row.car) : null,
      frame: row.frame ? new Uint8Array(row.frame) : null,
      eventTime: row.event_time ?? null
    };
  }
}
