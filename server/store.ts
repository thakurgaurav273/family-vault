import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { DATA_DIR, IS_PROD, K } from './config.ts';

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- Persistence: Neon Postgres (DATABASE_URL), JSON-file fallback for local dev ----------
export const DB_FILE = path.join(DATA_DIR, 'db.json');
export const db: Record<string, any> = {};
export interface PendingSignup {
  name: string; familyName?: string; cred: { salt: string; hash: string };
  code: { salt: string; hash: string }; exp: number; tries: number; sentAt: number;
}
export interface Priv {
  secret: string;
  credentials: Record<string, { salt: string; hash: string }>; // by user id (ids are globally unique)
  invites: Record<string, { id: string; exp: number; reset?: boolean }>; // token -> member + expiry
  families: string[]; // ids of every family workspace
  // Per-family private data. Family data itself lives in `db` under `${familyId}|${key}`.
  archive: Record<string, Record<string, any[]>>; // familyId -> account email -> file records of disconnected Drive accounts
  drives: Record<string, { refreshToken: string; folderId: string } | null>; // familyId -> Drive link (token AES-GCM encrypted)
  pending: Record<string, PendingSignup>; // lower-cased email -> signup waiting for its emailed code
  lock: Record<string, { n: number; until: number }>; // failed-login counters per user
  sv: Record<string, number>; // per-user session version (bump to revoke all sessions)
}
export const priv: Priv = { secret: '', credentials: {}, invites: {}, families: [], archive: {}, drives: {}, pending: {}, lock: {}, sv: {} };
export const PRIV_KEY = '__private';
export const saved: Record<string, string> = {};
export const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true }, max: 5 })
  : null;

export async function initStore() {
  if (IS_PROD && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be set in production (openssl rand -hex 32).');
  }
  let all: Record<string, any> = {};
  if (pool) {
    await pool.query('CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, n int NOT NULL, reset timestamptz NOT NULL)');
    await pool.query('CREATE TABLE IF NOT EXISTS app_state (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz DEFAULT now())');
    for (const r of (await pool.query('SELECT key, value FROM app_state')).rows) all[r.key] = r.value;
  } else {
    try { all = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { /* fresh start */ }
  }
  Object.assign(priv, all[PRIV_KEY] || {});
  delete all[PRIV_KEY];
  priv.sv ??= {};
  priv.lock ??= {};
  priv.families ??= [];
  priv.drives ??= {};
  priv.pending ??= {};
  for (const [t, v] of Object.entries(priv.invites)) // migrate legacy string invites
    if (typeof v === 'string') priv.invites[t] = { id: v, exp: Date.now() + 7 * 864e5 };

  // One-time migration from the single-family layout: the existing vault becomes the first family.
  const legacy = priv as any;
  if (!priv.families.length && all[K.members]) {
    const fid = LEGACY_FAMILY_ID;
    priv.families.push(fid);
    for (const k of Object.values(K)) if (k in all) { all[`${fid}|${k}`] = all[k]; delete all[k]; }
    priv.drives[fid] = legacy.drive ?? null;
    priv.archive = { [fid]: legacy.archive || {} };
    delete legacy.drive;
    if (pool) { // write the new rows and drop the old ones atomically, so a crash can't lose data
      const c = await pool.connect();
      const up = 'INSERT INTO app_state (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()';
      try {
        await c.query('BEGIN');
        for (const [k, v] of Object.entries(all)) if (k.startsWith(`${fid}|`)) await c.query(up, [k, JSON.stringify(v)]);
        await c.query(up, [PRIV_KEY, JSON.stringify(priv)]);
        await c.query('DELETE FROM app_state WHERE key = ANY($1)', [Object.values(K)]);
        await c.query('COMMIT');
      } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
    }
    console.log(`Migrated single-family data to family ${fid}`);
  }
  priv.archive ??= {};
  Object.assign(db, all);
  for (const [k, v] of Object.entries(db)) saved[k] = JSON.stringify(v);
  if (!priv.secret) priv.secret = crypto.randomBytes(32).toString('hex');
  persist();
}

let timer: NodeJS.Timeout | null = null;
export function persist() {
  if (timer) return;
  timer = setTimeout(async () => {
    timer = null;
    const snapshot: Record<string, any> = { ...db, [PRIV_KEY]: priv };
    try {
      if (pool) {
        for (const [k, v] of Object.entries(snapshot)) {
          const json = JSON.stringify(v);
          if (saved[k] === json) continue;
          await pool.query(
            'INSERT INTO app_state (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()',
            [k, json]);
          saved[k] = json;
        }
      } else {
        fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(snapshot), { mode: 0o600 });
        fs.renameSync(DB_FILE + '.tmp', DB_FILE);
      }
    } catch (e: any) { console.error('Persist failed:', e.message); }
  }, 100);
}

// Family data is namespaced by family id so one family can never address another's records.
export const LEGACY_FAMILY_ID = 'fam-default';
const fk = (fid: string, key: string) => `${fid}|${key}`;
export const get = <T,>(fid: string, key: string, fb: T): T => (db[fk(fid, key)] ?? fb) as T;
export const set = (fid: string, key: string, v: unknown) => { db[fk(fid, key)] = v; persist(); };
export const familyState = (fid: string, keys: string[]) => {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (fk(fid, k) in db) out[k] = db[fk(fid, k)];
  return out;
};
