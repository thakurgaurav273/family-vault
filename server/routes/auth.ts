import { Router } from 'express';
import crypto from 'crypto';
import { APP_URL, K } from '../config.ts';
import { get, set, priv, persist } from '../store.ts';
import { AVATAR, canSee, checkPw, findByEmail, hashPw, isAdmin, makeToken, members, readToken, requireAuth, requireRole, setSession, wrap } from '../auth.ts';
import { createInvite, inviteMemberId, revokeInvites, credKind, validSecret, secretError, lockedFor, noteLogin, createReset, resetMemberId } from '../auth.ts';
import { sendResetEmail } from '../services/email.ts';
import type { Member } from '../auth.ts';

export const router = Router();

router.get('/auth/status', (_req, res) => res.json({ hasOwner: members().some((m) => m.role === 'owner') }));

router.post('/auth/register', (req, res) => {
  if (members().some((m) => m.role === 'owner'))
    return res.status(403).json({ error: 'A family already exists. Ask the owner for an invitation.' });
  const { name, email, password, familyName } = req.body || {};
  if (!name || !email || !password || password.length < 8)
    return res.status(400).json({ error: 'Name, email and a password of 8+ characters are required.' });
  const owner: Member = {
    id: `user-${crypto.randomUUID()}`, name, email, role: 'owner', avatar: AVATAR,
    joinedAt: new Date().toISOString(), status: 'active', relationship: 'Owner',
  };
  priv.credentials[owner.id] = hashPw(password);
  set(K.members, [owner]);
  set(K.files, []); set(K.folders, []); set(K.notifications, []);
  set(K.workspace, {
    id: `workspace-${crypto.randomUUID()}`, name: familyName || `${name.split(' ').pop()} Family`,
    tagline: 'Every memory. Every document. One family home.', description: 'Our private family home.',
    avatar: AVATAR, createdAt: new Date().toISOString(), ownerId: owner.id, ownerName: owner.name,
    preferences: { defaultVisibility: 'family', uploadPermissions: 'all', fileDeletionPermissions: 'owner_admin',
      invitePermissions: 'admins', language: 'en', timezone: 'UTC' },
  });
  set(K.drive, { isConnected: false, accountEmail: '', accountName: '', lastSyncedAt: '', storageUsedBytes: 0,
    storageTotalBytes: 0, status: 'disconnected', breakdown: { photos: 0, videos: 0, documents: 0, other: 0 } });
  setSession(res, owner.id);
  res.json(owner);
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = email && findByEmail(email);
  const wait = user ? lockedFor(user.id) : 0;
  if (wait) return res.status(429).json({ error: `Too many wrong attempts. Try again in ${Math.ceil(wait / 60e3)} minute(s), or reset your PIN.` });
  const ok = !!user && user.status === 'active' && checkPw(String(password || ''), priv.credentials[user.id]);
  if (user && user.status === 'active') noteLogin(user.id, ok);
  if (!ok) return res.status(401).json({ error: 'Invalid email, password or PIN.' });
  setSession(res, user!.id);
  res.json(user);
});

router.get('/auth/invite/:token', (req, res) => {
  const m = members().find((x) => x.id === inviteMemberId(String(req.params.token)) && x.status === 'pending');
  if (!m) return res.status(404).json({ error: 'Invitation is invalid or already used.' });
  res.json({ email: m.email, name: m.name, role: m.role, kind: credKind(m.role), familyName: get<any>(K.workspace, {}).name });
});

router.post('/auth/accept-invite', (req, res) => {
  const { token, name, password } = req.body || {};
  const list = members();
  const m = list.find((x) => x.id === inviteMemberId(token) && x.status === 'pending');
  if (!m) return res.status(404).json({ error: 'Invitation is invalid or already used.' });
  if (!validSecret(credKind(m.role), password)) return res.status(400).json({ error: secretError(credKind(m.role)) });
  m.status = 'active'; m.name = name || m.name; m.joinedAt = new Date().toISOString();
  priv.credentials[m.id] = hashPw(password);
  delete priv.invites[token];
  set(K.members, list);
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
  const list = members();
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
  set(K.members, list);
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

// "Forgot PIN/password": always answers the same so it can't be used to discover who is a member.
router.post('/auth/forgot', async (req, res) => {
  const user = req.body?.email && findByEmail(String(req.body.email));
  if (user && user.status === 'active') {
    const url = `${APP_URL}/auth?reset=${createReset(user.id)}`;
    await sendResetEmail(user.email, get<any>(K.workspace, {}).name || 'Family', credKind(user.role), url).catch(() => false);
  }
  res.json({ ok: true });
});

router.get('/auth/reset/:token', (req, res) => {
  const m = members().find((x) => x.id === resetMemberId(req.params.token) && x.status === 'active');
  if (!m) return res.status(404).json({ error: 'This reset link is invalid or has expired.' });
  res.json({ kind: credKind(m.role), email: m.email });
});

router.post('/auth/reset', (req, res) => {
  const { token, secret } = req.body || {};
  const m = members().find((x) => x.id === resetMemberId(token) && x.status === 'active');
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
  const m = members().find((x) => x.id === String(req.params.id) && x.status === 'active');
  if (!m) return res.status(404).json({ error: 'Member not found.' });
  if (m.role === 'owner' || (m.role === 'admin' && req.user!.role !== 'owner'))
    return res.status(403).json({ error: 'You cannot reset this account.' });
  const url = `${APP_URL}/auth?reset=${createReset(m.id)}`;
  const emailed = await sendResetEmail(m.email, get<any>(K.workspace, {}).name || 'Family', credKind(m.role), url);
  res.json({ emailed, resetUrl: emailed ? undefined : url });
}));
