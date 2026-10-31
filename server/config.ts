import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
export const IS_PROD = process.env.NODE_ENV === 'production';
// Dev: API on 5174 behind the Vite dev server (5173, which proxies /api). Prod: one process serves both.
export const PORT = Number(process.env.PORT) || (IS_PROD ? 3000 : 5174);
export const APP_URL = (process.env.APP_URL || (IS_PROD ? `http://localhost:${PORT}` : 'http://localhost:5173')).replace(/\/$/, '');
export const KEY_RE = /^familyvault_[a-z_0-9]+$/;
export const K = {
  members: 'familyvault_members_v1',
  files: 'familyvault_files_v1',
  folders: 'familyvault_folders_v1',
  notifications: 'familyvault_notifications_v1',
  workspace: 'familyvault_workspace_v1',
  drive: 'familyvault_drive_connection_v1',
};
export const SERVER_ONLY_KEYS = new Set([K.drive]);
export const ADMIN_ONLY_KEYS = new Set([K.members, K.workspace]);

