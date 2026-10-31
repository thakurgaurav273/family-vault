import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { APP_URL, IS_PROD } from './config.ts';
import { pool, priv } from './store.ts';

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.googleusercontent.com",
      "media-src 'self' blob:", "connect-src 'self'", "frame-ancestors 'none'", "object-src 'none'",
      "base-uri 'self'", "form-action 'self'",
    ].join('; '));
  }
  next();
}

// CSRF defence in depth (on top of SameSite=Lax cookies): state-changing requests must come from our own origin.
export function sameOriginOnly(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const src = req.headers.origin || req.headers.referer;
  try {
    if (src && new URL(src).origin === new URL(APP_URL).origin) return next();
  } catch { /* fall through */ }
  res.status(403).json({ error: 'Cross-origin request blocked.' });
}

// Fixed-window limiter per IP. Shared across instances via Postgres when DATABASE_URL is set; memory otherwise.
export function rateLimit(scope: string, max: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  const memHit = (key: string) => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return { n: 1, retry: windowMs / 1000 }; }
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return { n: ++h.n, retry: (h.reset - now) / 1000 };
  };
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${scope}:${req.ip || 'unknown'}`;
    let r: { n: number; retry: number };
    try {
      if (!pool) throw new Error('no pool');
      const q = await pool.query(
        `INSERT INTO rate_limits (key, n, reset) VALUES ($1, 1, now() + ($2::int * interval '1 millisecond'))
         ON CONFLICT (key) DO UPDATE SET
           n = CASE WHEN rate_limits.reset < now() THEN 1 ELSE rate_limits.n + 1 END,
           reset = CASE WHEN rate_limits.reset < now() THEN now() + ($2::int * interval '1 millisecond') ELSE rate_limits.reset END
         RETURNING n, extract(epoch FROM reset - now()) AS retry`, [key, windowMs]);
      r = { n: q.rows[0].n, retry: Number(q.rows[0].retry) };
    } catch { r = memHit(key); }
    if (r.n > max) {
      res.setHeader('Retry-After', String(Math.ceil(r.retry)));
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
    next();
  };
}

// AES-256-GCM for secrets at rest (Drive refresh token). Key derives from SESSION_SECRET, which is not stored in the DB.
const encKey = () => crypto.createHash('sha256').update(`enc:${process.env.SESSION_SECRET || priv.secret}`).digest();
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return `v1.${[iv, c.getAuthTag(), ct].map((b) => b.toString('base64url')).join('.')}`;
}
export function decrypt(blob: string): string {
  if (!blob.startsWith('v1.')) return blob; // legacy plaintext value
  const [iv, tag, ct] = blob.slice(3).split('.').map((p) => Buffer.from(p, 'base64url'));
  const d = crypto.createDecipheriv('aes-256-gcm', encKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

export const randomId = () => crypto.randomUUID();

export const isEmail = (v: unknown): v is string => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
