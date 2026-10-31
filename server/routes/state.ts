import { Router } from 'express';
import crypto from 'crypto';
import { APP_URL, K } from '../config.ts';
import { db, get, set, priv, persist } from '../store.ts';
import { AVATAR, canSee, checkPw, findByEmail, hashPw, isAdmin, makeToken, members, readToken, requireAuth, requireRole, setSession, wrap } from '../auth.ts';
import { createInvite, inviteMemberId, revokeInvites } from '../auth.ts';
import type { Member } from '../auth.ts';
import { driveClient } from '../services/drive.ts';
import { KEY_RE, SERVER_ONLY_KEYS, ADMIN_ONLY_KEYS } from '../config.ts';
export const router = Router();

router.get('/state', requireAuth, (req, res) => {
  const out: Record<string, unknown> = { ...db };
  out[K.files] = get<any[]>(K.files, []).filter((f) => canSee(f, req.user!));
  res.json(out);
});

router.put('/state/:key', requireAuth, wrap(async (req, res) => {
  const key = String(req.params.key);
  if (!KEY_RE.test(key) || SERVER_ONLY_KEYS.has(key)) return res.status(400).json({ error: 'Invalid key' });
  if (ADMIN_ONLY_KEYS.has(key) && !isAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const value = req.body?.value;
  if (key === K.members) {
    // Members are only created via invites/registration. Here admins may remove people and change roles;
    // identity fields (id, email, status, avatar) are immutable and only the owner can change owner/admin roles.
    const old = members();
    if (!Array.isArray(value)) return res.status(400).json({ error: 'Invalid members list.' });
    const next: Member[] = [];
    for (const m of value) {
      const o = old.find((x) => x.id === m?.id);
      if (!o) return res.status(400).json({ error: 'Members can only be added through invitations.' });
      let role = ['owner', 'admin', 'member'].includes(m.role) ? m.role : o.role;
      if (o.role === 'owner' || role === 'owner') role = o.role;
      if (req.user!.role !== 'owner' && role !== o.role) role = o.role;
      next.push({ ...o, name: String(m.name ?? o.name).slice(0, 100), relationship: m.relationship ? String(m.relationship).slice(0, 60) : o.relationship, role });
    }
    const owner = old.find((m) => m.role === 'owner');
    if (!next.some((m) => m.id === owner?.id)) return res.status(400).json({ error: 'Owner cannot be removed.' });
    const removed = old.filter((o) => !next.some((m) => m.id === o.id));
    if (req.user!.role !== 'owner' && removed.some((m) => m.role === 'admin'))
      return res.status(403).json({ error: 'Only the owner can remove admins.' });
    for (const m of removed) {
      delete priv.credentials[m.id];
      revokeInvites(m.id);
    }
    set(key, next);
    return res.json({ ok: true });
  }
  if (key === K.workspace) {
    const cur = get<any>(K.workspace, {});
    set(key, { ...value, id: cur.id, ownerId: cur.ownerId, ownerName: cur.ownerName, createdAt: cur.createdAt });
    return res.json({ ok: true });
  }
  if (key === K.files && Array.isArray(value)) {
    // Deletions made by the client also remove the file from Drive (best effort).
    const keep = new Set(value.map((f: any) => f.id));
    const all = get<any[]>(K.files, []);
    const removed = all.filter((f) => !keep.has(f.id));
    const canDelete = get<any>(K.workspace, {}).preferences?.fileDeletionPermissions;
    for (const f of removed) {
      if (!isAdmin(req.user) && !(canDelete === 'uploader_only' && f.uploaderId === req.user!.id))
        return res.status(403).json({ error: 'You are not allowed to delete this file.' });
    }
    if (priv.drive) for (const f of removed) driveClient().files.delete({ fileId: f.driveFileId }).catch(() => {});
    // Never let the client overwrite files it cannot see.
    const hidden = all.filter((f) => !canSee(f, req.user!));
    const merged = value.flatMap((f: any) => {
      const a = all.find((x) => x.id === f?.id);
      if (!a) return []; // files are only created through /files/upload
      const mayEdit = isAdmin(req.user) || a.uploaderId === req.user!.id;
      return [{
        ...f,
        id: a.id, driveFileId: a.driveFileId, uploaderId: a.uploaderId, uploaderName: a.uploaderName,
        uploaderAvatar: a.uploaderAvatar, uploadedAt: a.uploadedAt, mimeType: a.mimeType, size: a.size,
        url: a.url, thumbnailUrl: a.thumbnailUrl, previewUrl: a.previewUrl, fileType: a.fileType, extension: a.extension,
        visibility: mayEdit && ['family', 'admins', 'private'].includes(f.visibility) ? f.visibility : a.visibility,
      }];
    });
    set(key, [...merged, ...hidden]);
    return res.json({ ok: true });
  }
  if (key === K.notifications) {
    if (!Array.isArray(value)) return res.status(400).json({ error: 'Invalid notifications.' });
    set(key, value.slice(0, 200));
    return res.json({ ok: true });
  }
  if (key === K.folders) {
    if (!Array.isArray(value) || value.length > 500) return res.status(400).json({ error: 'Invalid folders.' });
    const all = get<any[]>(K.folders, []);
    const keep = new Set(value.map((f: any) => f?.id));
    for (const f of all.filter((x) => !keep.has(x.id))) {
      if (f.isSystem || (!isAdmin(req.user) && f.createdBy !== req.user!.id))
        return res.status(403).json({ error: 'You are not allowed to delete this folder.' });
    }
    set(key, value.filter((f: any) => f && typeof f.id === 'string').map((f: any) => {
      const a = all.find((x) => x.id === f.id);
      if (!a) return { ...f, createdBy: req.user!.id, createdByName: req.user!.name, isSystem: false };
      const mayEdit = isAdmin(req.user) || a.createdBy === req.user!.id;
      return { ...(mayEdit ? f : a), id: a.id, driveFolderId: a.driveFolderId, createdBy: a.createdBy, createdByName: a.createdByName, createdAt: a.createdAt, isSystem: a.isSystem };
    }));
    return res.json({ ok: true });
  }
  set(key, value);
  res.json({ ok: true });
}));
