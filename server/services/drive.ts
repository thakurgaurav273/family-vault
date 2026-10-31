import { google } from 'googleapis';
import { APP_URL, K } from '../config.ts';
import { get, priv, set } from '../store.ts';
import { decrypt } from '../security.ts';

export const oauth = () =>
  new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${APP_URL}/api/drive/callback`);
export function driveClient(fid: string) {
  const link = priv.drives[fid];
  if (!link) throw Object.assign(new Error('Google Drive is not connected. Ask the family owner to connect it.'), { status: 409 });
  let token: string;
  try {
    token = decrypt(link.refreshToken);
  } catch {
    // Decryption fails when SESSION_SECRET changed since Drive was connected (e.g. Render regenerated it).
    // The only fix is to reconnect Drive so a new token is encrypted with the current secret.
    throw Object.assign(
      new Error('Google Drive credentials could not be decrypted — the server encryption key has changed. Please disconnect and reconnect Google Drive in Storage settings.'),
      { status: 409 },
    );
  }
  const auth = oauth();
  auth.setCredentials({ refresh_token: token });
  return google.drive({ version: 'v3', auth });
}
export async function refreshDriveStatus(fid: string, extra: Record<string, unknown> = {}) {
  const files = get<any[]>(fid, K.files, []);
  const sum = (t: string) => files.filter((f) => f.fileType === t).reduce((a, f) => a + f.size, 0);
  const breakdown = { photos: sum('photo'), videos: sum('video'), documents: sum('document'), other: 0 };
  const prev = get<any>(fid, K.drive, {});
  let quota = { storageUsedBytes: prev.storageUsedBytes || 0, storageTotalBytes: prev.storageTotalBytes || 0 };
  let status = 'healthy';
  try {
    const about = (await driveClient(fid).about.get({ fields: 'storageQuota' })).data.storageQuota;
    quota = {
      storageUsedBytes: Number(about?.usage || 0),
      storageTotalBytes: Number(about?.limit || 15 * 1024 ** 3),
    };
  } catch { status = 'warning'; }
  const conn = { ...prev, isConnected: true, status, lastSyncedAt: new Date().toISOString(), breakdown, ...quota, ...extra };
  set(fid, K.drive, conn);
  return conn;
}
