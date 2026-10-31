import { Router } from 'express';
import crypto from 'crypto';
import { APP_URL, IS_PROD, K } from '../config.ts';
import { get, set, priv, persist } from '../store.ts';
import { AVATAR, checkPw, findByEmail, findById, hashPw, members, requireAuth, requireRole, setSession, wrap } from '../auth.ts';
import { inviteMemberId, credKind, validSecret, secretError, lockedFor, noteLogin, createReset, resetMemberId } from '../auth.ts';
import { isEmail } from '../security.ts';
import { sendResetEmail, sendVerifyEmail } from '../services/email.ts';
import type { Member } from '../auth.ts';

export const router = Router();

// Anyone can create a family, but only after proving they own the email address.
router.get('/auth/status', (_req, res) => res.json({ hasOwner: true }));

const CODE_TTL_MS = 10 * 60e3, MAX_CODE_TRIES = 5, CODE_COOLDOWN_MS = 60e3, MAX_PENDING = 5000;
const hashCode = (code: string, salt: string) => crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
const purgePending = () => {
  for (const [k, p] of Object.entries(priv.pending)) if (p.exp < Date.now()) delete priv.pending[k];
};

// Step 1: validate the details and email a 6-digit code. Nothing is created yet.
router.post('/auth/register/start', wrap(async (req, res) => {
  const { name, email, password, familyName } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || name.length > 100) return res.status(400).json({ error: 'Enter your name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!validSecret('password', password)) return res.status(400).json({ error: secretError('password') });
  if (findByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
  purgePending();
  const key = email.toLowerCase();
  const prev = priv.pending[key];
  if (prev && Date.now() - prev.sentAt < CODE_COOLDOWN_MS)
    return res.status(429).json({ error: 'Please wait a minute before requesting another code.' });
  if (!prev && Object.keys(priv.pending).length >= MAX_PENDING) return res.status(503).json({ error: 'Busy. Try again later.' });
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const salt = crypto.randomBytes(16).toString('hex');
  priv.pending[key] = {
    name: name.trim(), familyName: typeof familyName === 'string' ? familyName.trim().slice(0, 100) || undefined : undefined,
    cred: hashPw(password), code: { salt, hash: hashCode(code, salt) }, exp: Date.now() + CODE_TTL_MS, tries: 0, sentAt: Date.now(),
  };
  persist();
  if (!(await sendVerifyEmail(email, code))) {
    if (IS_PROD) {
      delete priv.pending[key]; persist();
      return res.status(503).json({ error: 'We could not send the verification email. Please try again later.' });
    }
    console.log(`[dev] verification code for ${email}: ${code}`); // dev only, when no email service is configured
  }
  res.json({ ok: true, expiresInMinutes: CODE_TTL_MS / 60e3 });
}));

// Step 2: the right code creates the family and its owner.
router.post('/auth/register/verify', (req, res) => {
  const { email, code } = req.body || {};
  const key = typeof email === 'string' ? email.toLowerCase() : '';
  const p = priv.pending[key];
  if (!p || p.exp < Date.now()) {
    delete priv.pending[key]; persist();
    return res.status(400).json({ error: 'This code has expired. Start again to get a new one.' });
  }
  if (++p.tries > MAX_CODE_TRIES) {
    delete priv.pending[key]; persist();
    return res.status(429).json({ error: 'Too many wrong codes. Start again to get a new one.' });
  }
  const given = typeof code === 'string' && /^\d{6}$/.test(code) ? hashCode(code, p.code.salt) : '';
  const ok = given.length === p.code.hash.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(p.code.hash));
  if (!ok) { persist(); return res.status(400).json({ error: 'That code is not correct.' }); }
  delete priv.pending[key];
  if (findByEmail(email)) { persist(); return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' }); }

  const fid = `fam-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const owner: Member = {
    id: `user-${crypto.randomUUID()}`, name: p.name, email: email.trim(), role: 'owner', avatar: AVATAR,
    joinedAt: now, status: 'active', relationship: 'Owner',
  };
  priv.families.push(fid);
  priv.drives[fid] = null;
  priv.archive[fid] = {};
  priv.credentials[owner.id] = p.cred;
  set(fid, K.members, [owner]);
  set(fid, K.files, []); set(fid, K.folders, []); set(fid, K.notifications, []);
  set(fid, K.workspace, {
    id: `workspace-${crypto.randomUUID()}`, name: p.familyName || `${p.name.split(' ').pop()} Family`,
    tagline: 'Every memory. Every document. One family home.', description: 'Our private family home.',
    avatar: AVATAR, createdAt: now, ownerId: owner.id, ownerName: owner.name,
    preferences: { defaultVisibility: 'family', uploadPermissions: 'all', fileDeletionPermissions: 'owner_admin',
      invitePermissions: 'admins', language: 'en', timezone: 'UTC' },
  });
  set(fid, K.drive, { isConnected: false, accountEmail: '', accountName: '', lastSyncedAt: '', storageUsedBytes: 0,
    storageTotalBytes: 0, status: 'disconnected', breakdown: { photos: 0, videos: 0, documents: 0, other: 0 } });
  persist();
  setSession(res, owner.id);
  res.json(owner);
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = findByEmail(email)?.m;
  const wait = user ? lockedFor(user.id) : 0;
  if (wait) return res.status(429).json({ error: `Too many wrong attempts. Try again in ${Math.ceil(wait / 60e3)} minute(s), or reset your PIN.` });
  const ok = !!user && user.status === 'active' && checkPw(String(password || ''), priv.credentials[user.id]);
  if (user && user.status === 'active') noteLogin(user.id, ok);
  if (!ok) return res.status(401).json({ error: 'Invalid email, password or PIN.' });
  setSession(res, user!.id);
  res.json(user);
});

const pendingInvite = (token: unknown) => {
  const id = typeof token === 'string' ? inviteMemberId(token) : null;
  const hit = id ? findById(id) : undefined;
  return hit && hit.m.status === 'pending' ? hit : undefined;
};

router.get('/auth/invite/:token', (req, res) => {
  const hit = pendingInvite(req.params.token);
  if (!hit) return res.status(404).json({ error: 'Invitation is invalid or already used.' });
  const { m, fid } = hit;
  res.json({ email: m.email, name: m.name, role: m.role, kind: credKind(m.role), familyName: get<any>(fid, K.workspace, {}).name });
});

router.post('/auth/accept-invite', (req, res) => {
  const { token, name, password } = req.body || {};
  const hit = pendingInvite(token);
  if (!hit) return res.status(404).json({ error: 'Invitation is invalid or already used.' });
  const { m, fid } = hit;
  if (!validSecret(credKind(m.role), password)) return res.status(400).json({ error: secretError(credKind(m.role)) });
  m.status = 'active'; m.name = typeof name === 'string' && name.trim() ? name.trim().slice(0, 100) : m.name; m.joinedAt = new Date().toISOString();
  priv.credentials[m.id] = hashPw(password);
  delete priv.invites[token];
  set(fid, K.members, members(fid)); // `m` is a live entry of that list
  setSession(res, m.id);
  res.json(m);
});

router.post('/auth/logout', (_req, res) => { res.clearCookie('fv_session'); res.json({ ok: true }); });
router.get('/auth/me', requireAuth, (req, res) => res.json(req.user));

// Revoke every session of the current user (all devices).
router.post('/auth/logout-all', requireAuth, (req, res) => {
  priv.sv[req.user!.id] = (priv.sv[req.user!.id] || 0) + 1;
  persist();
  res.clearCookie('fv_session');
  res.json({ ok: true });
});

// Members edit their own profile here; the shared state endpoint is admin-only for members.
router.patch('/auth/me', requireAuth, (req, res) => {
  const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : undefined);
  const { name, relationship, phone, avatar } = req.body || {};
  const list = members(req.fid!);
  const me = list.find((m) => m.id === req.user!.id)!;
  if (clip(name, 100)) me.name = clip(name, 100)!;
  if (relationship !== undefined) me.relationship = clip(relationship, 60);
  if (phone !== undefined) (me as any).phone = clip(phone, 30);
  if (avatar !== undefined) {
    // Only small JPEG/PNG/WebP data URLs produced by the client-side resizer.
    if (typeof avatar !== 'string' || avatar.length > 150_000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar))
      return res.status(400).json({ error: 'Profile picture must be a small JPG, PNG or WebP image.' });
    me.avatar = avatar;
  }
  set(req.fid!, K.members, list);
  res.json(me);
});

// Change own password / PIN (requires the current one).
router.post('/auth/change-secret', requireAuth, (req, res) => {
  const { current, next } = req.body || {};
  const kind = credKind(req.user!.role);
  if (lockedFor(req.user!.id)) return res.status(429).json({ error: 'Too many wrong attempts. Try again later.' });
  const ok = checkPw(String(current || ''), priv.credentials[req.user!.id]);
  noteLogin(req.user!.id, ok);
  if (!ok) return res.status(401).json({ error: `Current ${kind === 'pin' ? 'PIN' : 'password'} is incorrect.` });
  if (!validSecret(kind, next)) return res.status(400).json({ error: secretError(kind) });
  priv.credentials[req.user!.id] = hashPw(next);
  priv.sv[req.user!.id] = (priv.sv[req.user!.id] || 0) + 1; // sign out other devices
  persist();
  setSession(res, req.user!.id);
  res.json({ ok: true });
});

// "Forgot PIN/password": always answers the same, and never waits on the email send, so neither the
// response nor its timing reveals who is a member.
router.post('/auth/forgot', (req, res) => {
  const hit = findByEmail(req.body?.email);
  if (hit && hit.m.status === 'active') {
    const url = `${APP_URL}/auth?reset=${createReset(hit.m.id)}`;
    void sendResetEmail(hit.m.email, get<any>(hit.fid, K.workspace, {}).name || 'Family', credKind(hit.m.role), url).catch(() => false);
  }
  res.json({ ok: true });
});

const activeFromReset = (token: unknown) => {
  const id = resetMemberId(token);
  const hit = id ? findById(id) : undefined;
  return hit && hit.m.status === 'active' ? hit.m : undefined;
};

router.get('/auth/reset/:token', (req, res) => {
  const m = activeFromReset(req.params.token);
  if (!m) return res.status(404).json({ error: 'This reset link is invalid or has expired.' });
  res.json({ kind: credKind(m.role), email: m.email });
});

router.post('/auth/reset', (req, res) => {
  const { token, secret } = req.body || {};
  const m = activeFromReset(token);
  if (!m) return res.status(404).json({ error: 'This reset link is invalid or has expired.' });
  if (!validSecret(credKind(m.role), secret)) return res.status(400).json({ error: secretError(credKind(m.role)) });
  priv.credentials[m.id] = hashPw(secret);
  priv.sv[m.id] = (priv.sv[m.id] || 0) + 1;
  delete priv.invites[token];
  noteLogin(m.id, true);
  setSession(res, m.id);
  res.json(m);
});

// Owner/admin sends a member a PIN-reset link (admins can't reset the owner or other admins).
router.post('/members/:id/reset-credentials', requireAuth, requireRole('owner', 'admin'), wrap(async (req, res) => {
  const fid = req.fid!;
  const m = members(fid).find((x) => x.id === String(req.params.id) && x.status === 'active');
  if (!m) return res.status(404).json({ error: 'Member not found.' });
  if (m.role === 'owner' || (m.role === 'admin' && req.user!.role !== 'owner'))
    return res.status(403).json({ error: 'You cannot reset this account.' });
  const url = `${APP_URL}/auth?reset=${createReset(m.id)}`;
  const emailed = await sendResetEmail(m.email, get<any>(fid, K.workspace, {}).name || 'Family', credKind(m.role), url);
  if (emailed) return res.json({ emailed });
  // The link is a sign-in credential for that member, so only the owner may ever see it.
  if (req.user!.role === 'owner') return res.json({ emailed, resetUrl: url });
  for (const [t, i] of Object.entries(priv.invites)) if (i.id === m.id && i.reset) delete priv.invites[t];
  persist();
  res.json({ emailed });
}));
