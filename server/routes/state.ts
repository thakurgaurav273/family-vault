import { Router } from 'express';
import { K, SERVER_ONLY_KEYS, ADMIN_ONLY_KEYS } from '../config.ts';
import { familyState, get, set, priv } from '../store.ts';
import { canSee, isAdmin, members, requireAuth, revokeInvites, wrap } from '../auth.ts';
import type { Member } from '../auth.ts';
import { driveClient } from '../services/drive.ts';
export const router = Router();

// Only these keys exist per family; anything else is rejected so clients can't store arbitrary data.
const FAMILY_KEYS = Object.values(K);

router.get('/state', requireAuth, (req, res) => {
  const out = familyState(req.fid!, FAMILY_KEYS);
  out[K.files] = get<any[]>(req.fid!, K.files, []).filter((f) => canSee(f, req.user!));
  res.json(out);
});

router.put('/state/:key', requireAuth, wrap(async (req, res) => {
  const fid = req.fid!;
  const key = String(req.params.key);
  if (!FAMILY_KEYS.includes(key) || SERVER_ONLY_KEYS.has(key)) return res.status(400).json({ error: 'Invalid key' });
  if (ADMIN_ONLY_KEYS.has(key) && !isAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const value = req.body?.value;
  if (key === K.members) {
    // Members are only created via invites/registration. Here admins may remove people and change roles;
    // identity fields (id, email, status, avatar) are immutable and only the owner can change owner/admin roles.
    const old = members(fid);
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
    set(fid, key, next);
    return res.json({ ok: true });
  }
  if (key === K.workspace) {
    const cur = get<any>(fid, K.workspace, {});
    set(fid, key, { ...value, id: cur.id, ownerId: cur.ownerId, ownerName: cur.ownerName, createdAt: cur.createdAt });
    return res.json({ ok: true });
  }
  if (key === K.files && Array.isArray(value)) {
    // The client only ever holds the files it may see, so only those can be deleted or edited through it.
    // (Treating every unseen file as "removed" would delete other people's private files from Drive.)
    const all = get<any[]>(fid, K.files, []);
    const visible = all.filter((f) => canSee(f, req.user!));
    const hidden = all.filter((f) => !canSee(f, req.user!));
    const keep = new Set(value.map((f: any) => f?.id));
    const removed = visible.filter((f) => !keep.has(f.id));
    const canDelete = get<any>(fid, K.workspace, {}).preferences?.fileDeletionPermissions;
    for (const f of removed) {
      if (!isAdmin(req.user) && !(canDelete === 'uploader_only' && f.uploaderId === req.user!.id))
        return res.status(403).json({ error: 'You are not allowed to delete this file.' });
    }
    if (priv.drives[fid]) for (const f of removed) driveClient(fid).files.delete({ fileId: f.driveFileId }).catch(() => {});
    const seen = new Set<string>();
    const merged = value.flatMap((f: any) => {
      const a = visible.find((x) => x.id === f?.id);
      if (!a || seen.has(a.id)) return []; // files are only created through /files/upload
      seen.add(a.id);
      const mayEdit = isAdmin(req.user) || a.uploaderId === req.user!.id;
      // Everyone may star a file; only its uploader or an admin may rename, move, retag or change its visibility.
      if (!mayEdit) return [{ ...a, isFavorite: typeof f.isFavorite === 'boolean' ? f.isFavorite : a.isFavorite }];
      return [{
        ...f,
        id: a.id, driveFileId: a.driveFileId, uploaderId: a.uploaderId, uploaderName: a.uploaderName,
        uploaderAvatar: a.uploaderAvatar, uploadedAt: a.uploadedAt, mimeType: a.mimeType, size: a.size,
        url: a.url, thumbnailUrl: a.thumbnailUrl, previewUrl: a.previewUrl, fileType: a.fileType, extension: a.extension,
        visibility: ['family', 'admins', 'private'].includes(f.visibility) ? f.visibility : a.visibility,
      }];
    });
    set(fid, key, [...merged, ...hidden]);
    return res.json({ ok: true });
  }
  if (key === K.notifications) {
    if (!Array.isArray(value)) return res.status(400).json({ error: 'Invalid notifications.' });
    set(fid, key, value.slice(0, 200));
    return res.json({ ok: true });
  }
  if (key === K.folders) {
    if (!Array.isArray(value) || value.length > 500) return res.status(400).json({ error: 'Invalid folders.' });
    const all = get<any[]>(fid, K.folders, []);
    const keep = new Set(value.map((f: any) => f?.id));
    for (const f of all.filter((x) => !keep.has(x.id))) {
      if (f.isSystem || (!isAdmin(req.user) && f.createdBy !== req.user!.id))
        return res.status(403).json({ error: 'You are not allowed to delete this folder.' });
    }
    set(fid, key, value.filter((f: any) => f && typeof f.id === 'string').map((f: any) => {
      const a = all.find((x) => x.id === f.id);
      if (!a) return { ...f, createdBy: req.user!.id, createdByName: req.user!.name, isSystem: false };
      const mayEdit = isAdmin(req.user) || a.createdBy === req.user!.id;
      return { ...(mayEdit ? f : a), id: a.id, driveFolderId: a.driveFolderId, createdBy: a.createdBy, createdByName: a.createdByName, createdAt: a.createdAt, isSystem: a.isSystem };
    }));
    return res.json({ ok: true });
  }
  res.status(400).json({ error: 'Invalid value' });
}));
