import { Router } from 'express';
import crypto from 'crypto';
import { APP_URL, K } from '../config.ts';
import { get, set, priv, persist } from '../store.ts';
import { isEmail } from '../security.ts';
import { AVATAR, canSee, checkPw, findByEmail, hashPw, isAdmin, makeToken, members, readToken, requireAuth, requireRole, setSession, wrap } from '../auth.ts';
import { createInvite, inviteMemberId, revokeInvites } from '../auth.ts';
import type { Member } from '../auth.ts';
import { sendInviteEmail } from '../services/email.ts';
export const router = Router();

router.post('/invites', requireAuth, requireRole('owner', 'admin'), wrap(async (req, res) => {
  const fid = req.fid!;
  const { role = 'member', relationship } = req.body || {};
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (findByEmail(email)) return res.status(409).json({ error: 'This email is already registered.' });
  const nm = email.split('@')[0];
  const m: Member = {
    id: `user-${crypto.randomUUID()}`, name: nm.charAt(0).toUpperCase() + nm.slice(1), email,
    role: role === 'admin' && req.user!.role === 'owner' ? 'admin' : 'member', avatar: AVATAR,
    joinedAt: new Date().toISOString(), status: 'pending', relationship: relationship || 'Family Member',
  };
  const token = createInvite(m.id);
  set(fid, K.members, [...members(fid), m]);
  const inviteUrl = `${APP_URL}/auth?invite=${token}`;
  const emailed = await sendInviteEmail(email, req.user!.name, get<any>(req.fid!, K.workspace, {}).name || 'Family', inviteUrl);
  res.json({ member: m, inviteUrl, emailed });
}));

router.post('/invites/:memberId/resend', requireAuth, requireRole('owner', 'admin'), wrap(async (req, res) => {
  const m = members(req.fid!).find((x) => x.id === String(req.params.memberId) && x.status === 'pending');
  if (!m) return res.status(404).json({ error: 'Pending invitation not found.' });
  const token = createInvite(m.id);
  const inviteUrl = `${APP_URL}/auth?invite=${token}`;
  const emailed = await sendInviteEmail(m.email, req.user!.name, get<any>(req.fid!, K.workspace, {}).name || 'Family', inviteUrl);
  res.json({ inviteUrl, emailed });
}));
