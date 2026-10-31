import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { APP_URL, IS_PROD, K } from './config.ts';
import { get, persist, priv } from './store.ts';

// ---------- Auth helpers ----------
export const hashPw = (pw: string, salt = crypto.randomBytes(16).toString('hex')) =>
  ({ salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') });
const DUMMY = { salt: 'a'.repeat(32), hash: 'b'.repeat(128) };
// Always runs scrypt, even for unknown users, so response time doesn't reveal which emails exist.
export const checkPw = (pw: string, c?: { salt: string; hash: string }) => {
  const cred = c ?? DUMMY;
  const ok = crypto.timingSafeEqual(Buffer.from(hashPw(pw, cred.salt).hash, 'hex'), Buffer.from(cred.hash, 'hex'));
  return !!c && ok;
};
export const sign = (payload: string) =>
  crypto.createHmac('sha256', process.env.SESSION_SECRET || priv.secret).update(payload).digest('base64url');
const safeEq = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
// `kind` namespaces tokens so e.g. an OAuth state value can never be replayed as a session cookie.
export const makeToken = (kind: string, data: string, ttlMs: number) => {
  const p = Buffer.from(JSON.stringify({ d: `${kind}:${data}`, e: Date.now() + ttlMs })).toString('base64url');
  return `${p}.${sign(p)}`;
};
export function readToken(kind: string, tok?: string): string | null {
  if (!tok) return null;
  const [p, s] = tok.split('.');
  if (!p || !s || !safeEq(sign(p), s)) return null;
  try {
    const { d, e } = JSON.parse(Buffer.from(p, 'base64url').toString());
    return e > Date.now() && typeof d === 'string' && d.startsWith(`${kind}:`) ? d.slice(kind.length + 1) : null;
  } catch { return null; }
}
export const cookie = (req: Request, name: string) =>
  req.headers.cookie?.split(';').map((c) => c.trim().split('=')).find(([k]) => k === name)?.[1];
export const setSession = (res: Response, userId: string) =>
  res.cookie('fv_session', makeToken('session', `${userId}.${priv.sv[userId] || 0}`, 30 * 864e5), {
    httpOnly: true, sameSite: 'lax', secure: IS_PROD && APP_URL.startsWith('https'), maxAge: 30 * 864e5,
  });
export const AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

export type Member = { id: string; name: string; email: string; role: 'owner' | 'admin' | 'member'; avatar: string; joinedAt: string; status: 'active' | 'pending'; relationship?: string };
declare module 'express-serve-static-core' { interface Request { user?: Member } }
export const members = () => get<Member[]>(K.members, []);
export const findByEmail = (e: string) => members().find((m) => m.email.toLowerCase() === e.toLowerCase());

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const raw = readToken('session', cookie(req, 'fv_session')) || '';
  const cut = raw.lastIndexOf('.');
  const id = raw.slice(0, cut);
  const user = members().find((m) => m.id === id && m.status === 'active');
  if (user && Number(raw.slice(cut + 1)) !== (priv.sv[id] || 0)) return res.status(401).json({ error: 'Session expired' });
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
}
export const isAdmin = (u?: Member) => u?.role === 'owner' || u?.role === 'admin';
export function requireRole(...roles: Member['role'][]) {
  return (req: Request, res: Response, next: NextFunction) =>
    roles.includes(req.user!.role) ? next() : res.status(403).json({ error: 'Forbidden' });
}
export const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

export const canSee = (f: any, u: Member) =>
    f.visibility === 'family' || (f.visibility === 'admins' ? isAdmin(u) : f.uploaderId === u.id || u.role === 'owner');

// ---------- Invites (single-use, expire after 7 days) ----------
export const INVITE_TTL_MS = 7 * 864e5;
export const revokeInvites = (memberId: string) => {
  for (const [t, i] of Object.entries(priv.invites)) if (i.id === memberId) delete priv.invites[t];
};
export const createInvite = (memberId: string) => {
  revokeInvites(memberId);
  const token = crypto.randomBytes(24).toString('base64url');
  priv.invites[token] = { id: memberId, exp: Date.now() + INVITE_TTL_MS };
  persist();
  return token;
};
export const inviteMemberId = (token: string): string | null => {
  const i = priv.invites[token];
  if (!i || i.reset) return null;
  if (i.exp < Date.now()) { delete priv.invites[token]; persist(); return null; }
  return i.id;
};

// ---------- Credential policy: the owner uses a password, everyone else a 6-digit PIN ----------
export const credKind = (role: string): 'password' | 'pin' => (role === 'owner' ? 'password' : 'pin');
export const validSecret = (kind: 'password' | 'pin', v: unknown) =>
  typeof v === 'string' && (kind === 'pin' ? /^\d{6}$/.test(v) : v.length >= 8 && v.length <= 200);
export const secretError = (kind: 'password' | 'pin') =>
  kind === 'pin' ? 'PIN must be exactly 6 digits.' : 'Password must be 8+ characters.';

// A short PIN is only safe with a hard lockout: 5 wrong tries lock the account for 15 minutes.
const MAX_TRIES = 5, LOCK_MS = 15 * 60e3;
export const lockedFor = (id: string) => Math.max(0, (priv.lock[id]?.until || 0) - Date.now());
export const noteLogin = (id: string, ok: boolean) => {
  if (ok) { delete priv.lock[id]; return persist(); }
  const l = priv.lock[id] && priv.lock[id].until > Date.now() - LOCK_MS ? priv.lock[id] : { n: 0, until: 0 };
  l.n += 1;
  if (l.n >= MAX_TRIES) { l.until = Date.now() + LOCK_MS; l.n = 0; }
  priv.lock[id] = l;
  persist();
};

// ---------- Password / PIN reset (single-use, 30 minutes) ----------
export const createReset = (memberId: string) => {
  for (const [t, i] of Object.entries(priv.invites)) if (i.id === memberId && i.reset) delete priv.invites[t];
  const token = crypto.randomBytes(24).toString('base64url');
  priv.invites[token] = { id: memberId, exp: Date.now() + 30 * 60e3, reset: true };
  persist();
  return token;
};
export const resetMemberId = (token: unknown): string | null => {
  const i = typeof token === 'string' ? priv.invites[token] : undefined;
  if (!i || !i.reset) return null;
  if (i.exp < Date.now()) { delete priv.invites[token as string]; persist(); return null; }
  return i.id;
};
