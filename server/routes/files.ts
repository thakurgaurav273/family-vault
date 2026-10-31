import { Router } from 'express';
import crypto from 'crypto';
import { APP_URL, K } from '../config.ts';
import { get, set, priv, persist } from '../store.ts';
import { AVATAR, canSee, checkPw, findByEmail, hashPw, isAdmin, makeToken, members, readToken, requireAuth, requireRole, setSession, wrap } from '../auth.ts';
import type { Member } from '../auth.ts';
import busboy from 'busboy';
import { PassThrough, Readable } from 'stream';
import { driveClient } from '../services/drive.ts';
export const router = Router();

const typeOf = (mime: string) => (mime.startsWith('image/') ? 'photo' : mime.startsWith('video/') ? 'video' : 'document');

// Streams each file straight from the request into Drive; nothing is buffered in memory or on disk.
router.post('/files/upload', requireAuth, wrap(async (req, res) => {
  const fid = req.fid!;
  const ws = get<any>(fid, K.workspace, {});
  if (ws.preferences?.uploadPermissions === 'admins' && !isAdmin(req.user))
    return res.status(403).json({ error: 'Only admins can upload files.' });
  const drive = driveClient(fid);
  const fields: Record<string, string> = {};
  const jobs: Promise<{ driveId: string; name: string; mime: string; size: number }>[] = [];
  const maxBytes = (Number(process.env.MAX_UPLOAD_MB) || 2048) * 1024 * 1024;
  const bb = busboy({ headers: req.headers, defParamCharset: 'utf8', limits: { fileSize: maxBytes, files: 20, fields: 20 } });
  bb.on('field', (n, v) => { fields[n] = v; });
  // Each FamilyVault folder maps to a subfolder of the vault's Drive folder, created on first use.
  const driveFolders = new Map<string, Promise<string>>();
  const parentFor = async (appFolderId?: string): Promise<string> => {
    let root = priv.drives[fid]?.folderId;
    if (!root) {
      const wsName = get<any>(fid, K.workspace, {}).name || 'Family';
      const created = await drive.files.create({
        requestBody: { name: `FamilyVault - ${wsName}`, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });
      root = created.data.id!;
      if (priv.drives[fid]) { priv.drives[fid]!.folderId = root; persist(); }
    }
    const folder = appFolderId ? get<any[]>(fid, K.folders, []).find((x) => x.id === appFolderId) : null;
    if (!folder) return root;
    if (folder.driveFolderId) return folder.driveFolderId;
    if (!driveFolders.has(folder.id)) {
      driveFolders.set(folder.id, drive.files.create({
        requestBody: { name: String(folder.name).slice(0, 100), mimeType: 'application/vnd.google-apps.folder', parents: [root] },
        fields: 'id',
      }).then((r) => {
        const id = r.data.id!;
        set(fid, K.folders, get<any[]>(fid, K.folders, []).map((x) => (x.id === folder.id ? { ...x, driveFolderId: id } : x)));
        return id;
      }));
    }
    return driveFolders.get(folder.id)!;
  };
  bb.on('file', (_n, stream, info) => {
    let size = 0;
    stream.on('data', (c: Buffer) => { size += c.length; });
    stream.on('limit', () => stream.destroy(Object.assign(new Error('File is too large.'), { status: 413 })));
    // Pipe immediately so busboy's stream is consumed while the Drive parent folder is resolved.
    const body = new PassThrough();
    stream.on('error', (e) => body.destroy(e));
    stream.pipe(body);
    const job = parentFor(fields.folderId)
      .then((parent) =>
        drive.files.create({
          requestBody: { name: info.filename, parents: [parent] },
          media: { mimeType: info.mimeType, body },
          fields: 'id',
        })
      )
      .then((r) => ({ driveId: r.data.id!, name: info.filename || 'file', mime: info.mimeType, size }))
      .catch((err) => {
        const msg =
          err?.response?.data?.error_description ||
          err?.response?.data?.error?.message ||
          err?.message ||
          'Google Drive upload failed';
        const isAuth =
          msg.includes('invalid_grant') ||
          msg.includes('revoked') ||
          err?.response?.status === 401 ||
          err?.code === 401;
        if (isAuth) {
          throw Object.assign(
            new Error('Google Drive authorization expired or revoked. Please reconnect Google Drive in Storage settings.'),
            { status: 401 }
          );
        }
        const status =
          err?.response?.status ||
          (typeof err?.code === 'number' && err.code >= 400 && err.code < 600 ? err.code : 500);
        throw Object.assign(new Error(msg), { status });
      });
    jobs.push(job);
  });
  await new Promise<void>((ok, bad) => { bb.on('close', ok); bb.on('error', bad); req.pipe(bb); });
  const CATEGORIES = ['personal', 'education', 'financial', 'medical', 'identity', 'bills', 'other'];
  const VISIBILITIES = ['family', 'admins', 'private'];
  const category = CATEGORIES.includes(fields.category) ? fields.category : 'other';
  const visibility = VISIBILITIES.includes(fields.visibility) ? fields.visibility : ws.preferences?.defaultVisibility || 'family';
  const folderId = (get<any[]>(fid, K.folders, []).find((x) => x.id === fields.folderId) || {}).id || null;
  const created = (await Promise.all(jobs)).map((f) => {
    const id = `file-${crypto.randomUUID()}`;
    const ext = (f.name.split('.').pop() || 'FILE').toUpperCase();
    const url = `/api/files/${id}/content`;
    return {
      id, name: f.name, originalName: f.name, fileType: typeOf(f.mime), mimeType: f.mime, extension: ext, size: f.size,
      url, thumbnailUrl: url, uploaderId: req.user!.id, uploaderName: req.user!.name, uploaderAvatar: req.user!.avatar,
      uploadedAt: new Date().toISOString(), category, folderId, visibility,
      isFavorite: false, tags: [category, ext], driveFileId: f.driveId,
    };
  });
  set(fid, K.files, [...created, ...get<any[]>(fid, K.files, [])]);
  res.json(created);
}));

router.get('/files/:id/content', requireAuth, wrap(async (req, res) => {
  const fid = req.fid!;
  const f = get<any[]>(fid, K.files, []).find((x) => x.id === String(req.params.id));
  if (!f || !canSee(f, req.user!)) return res.status(404).json({ error: 'Not found' });
  const range = req.headers.range;
  const r = await driveClient(fid).files.get(
    { fileId: f.driveFileId, alt: 'media' },
    { responseType: 'stream', headers: range ? { Range: range } : {} },
  );
  res.status(r.status);
  // User-uploaded bytes are served from our origin: never let them execute as HTML/SVG/JS (stored XSS).
  const inlineSafe = /^(image\/(png|jpe?g|gif|webp|avif|heic|heif|bmp)|video\/(mp4|webm|quicktime|x-matroska)|audio\/(mpeg|mp4|wav|ogg|webm)|application\/pdf)$/i;
  const safe = inlineSafe.test(f.mimeType);
  res.setHeader('Content-Type', safe ? f.mimeType : 'application/octet-stream');
  res.setHeader('Content-Disposition', `${safe ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`);
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; media-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  for (const h of ['content-length', 'content-range', 'accept-ranges'])
    if (r.headers[h]) res.setHeader(h, String(r.headers[h]));
  (r.data as Readable).pipe(res);
}));
