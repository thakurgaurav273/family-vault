import { Router } from 'express';
import crypto from 'crypto';
import { APP_URL, K } from '../config.ts';
import { get, set, priv, persist } from '../store.ts';
import { AVATAR, canSee, checkPw, findByEmail, hashPw, isAdmin, makeToken, members, readToken, requireAuth, requireRole, setSession, wrap } from '../auth.ts';
import type { Member } from '../auth.ts';
import { google } from 'googleapis';
import { decrypt, encrypt } from '../security.ts';
import { oauth, refreshDriveStatus, driveClient } from '../services/drive.ts';
export const router = Router();

router.get('/drive/connect', requireAuth, requireRole('owner'), (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return res.status(500).send('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first.');
  res.redirect(oauth().generateAuthUrl({
    access_type: 'offline', prompt: 'select_account consent', include_granted_scopes: true,
    scope: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    state: makeToken(req.query.returnTo === 'setup' ? 'drive-oauth-setup' : 'drive-oauth', req.user!.id, 10 * 60e3),
  }));
});

router.get('/drive/callback', requireAuth, requireRole('owner'), wrap(async (req, res) => {
  const st = String(req.query.state);
  const fromSetup = readToken('drive-oauth-setup', st) === req.user!.id;
  const back = fromSetup ? '/setup?step=2&' : '/storage?';
  if ((!fromSetup && readToken('drive-oauth', st) !== req.user!.id) || !req.query.code)
    return res.redirect(`${back}drive=error`);
  const client = oauth();
  const { tokens } = await client.getToken(String(req.query.code));
  const refreshToken = tokens.refresh_token || (priv.drive ? decrypt(priv.drive.refreshToken) : undefined);
  if (!refreshToken) return res.redirect(`${back}drive=error`);
  client.setCredentials(tokens);
  const info = (await google.oauth2({ version: 'v2', auth: client }).userinfo.get()).data;
  const drive = google.drive({ version: 'v3', auth: client });
  const prevEmail = get<any>(K.drive, {}).accountEmail;
  const switched = !!prevEmail && !!info.email && prevEmail.toLowerCase() !== info.email.toLowerCase();
  if (switched) {
    // Active files always live in the connected account. Park the old account's files (they come back if it is
    // reconnected) and restore any parked for the new one. Sub-folder ids are per-account and recreated on upload.
    const key = (e: string) => e.toLowerCase();
    priv.archive[key(prevEmail)] = [...(priv.archive[key(prevEmail)] || []), ...get<any[]>(K.files, [])];
    set(K.files, priv.archive[key(info.email!)] || []);
    delete priv.archive[key(info.email!)];
    set(K.folders, get<any[]>(K.folders, []).map(({ driveFolderId: _drop, ...f }) => f));
  }
  let folderId = priv.drive?.folderId;
  if (!folderId) {
    folderId = (await drive.files.create({
      requestBody: { name: `FamilyVault - ${get<any>(K.workspace, {}).name || 'Family'}`, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })).data.id!;
  }
  priv.drive = { refreshToken: encrypt(refreshToken), folderId }; persist();
  await refreshDriveStatus({ accountEmail: info.email, accountName: info.name, accountAvatar: info.picture });
  res.redirect(`${back}drive=${switched ? 'switched' : 'connected'}`);
}));

router.get('/drive/status', requireAuth, wrap(async (_req, res) => {
  res.json(priv.drive ? await refreshDriveStatus() : get(K.drive, { isConnected: false }));
}));

router.post('/drive/disconnect', requireAuth, requireRole('owner'), wrap(async (_req, res) => {
  if (priv.drive) {
    try { await oauth().revokeToken(decrypt(priv.drive.refreshToken)); } catch { /* already revoked */ }
    priv.drive = null; persist();
  }
  set(K.drive, { ...get<any>(K.drive, {}), isConnected: false, status: 'disconnected', storageUsedBytes: 0, storageTotalBytes: 0 });
  res.json(get(K.drive, {}));
}));
