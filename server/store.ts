import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { DATA_DIR, IS_PROD } from './config.ts';

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- Persistence: Neon Postgres (DATABASE_URL), JSON-file fallback for local dev ----------
export const DB_FILE = path.join(DATA_DIR, 'db.json');
export const db: Record<string, any> = {};
export interface Priv {
  secret: string;
  credentials: Record<string, { salt: string; hash: string }>;
  invites: Record<string, { id: string; exp: number; reset?: boolean }>; // token -> member + expiry
  archive: Record<string, any[]>; // file records of Drive accounts that are no longer connected, by account email
  lock: Record<string, { n: number; until: number }>; // failed-login counters per user
  sv: Record<string, number>; // per-user session version (bump to revoke all sessions)
  drive: { refreshToken: string; folderId: string } | null; // refreshToken is AES-GCM encrypted
}
export const priv: Priv = { secret: '', credentials: {}, invites: {}, archive: {}, lock: {}, sv: {}, drive: null };
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
  priv.archive ??= {};
  for (const [t, v] of Object.entries(priv.invites)) // migrate legacy string invites
    if (typeof v === 'string') priv.invites[t] = { id: v, exp: Date.now() + 7 * 864e5 };
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

export const get = <T,>(key: string, fb: T): T => (db[key] ?? fb) as T;
export const set = (key: string, v: unknown) => { db[key] = v; persist(); };
