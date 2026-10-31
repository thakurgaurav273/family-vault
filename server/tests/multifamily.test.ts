// Integration tests: boots the real server against a throwaway data dir (never a real database).
// Run: npm test
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 5300 + Math.floor(Math.random() * 400);
const BASE = `http://localhost:${PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fv-test-'));
let child: ChildProcess;
const codes: Record<string, string> = {};

const cred = (pw: string) => { const salt = crypto.randomBytes(16).toString('hex'); return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') }; };
const member = (id: string, role: string, email: string) => ({ id, name: id, email, role, avatar: '', joinedAt: '2024-01-01', status: 'active', relationship: role });
const file = (id: string, uploaderId: string, visibility: string) => ({ id, name: `${id}.jpg`, fileType: 'photo', mimeType: 'image/jpeg', size: 1, uploaderId, uploaderName: uploaderId, visibility, driveFileId: `d-${id}`, isFavorite: false, tags: [] });

async function api(method: string, url: string, body?: unknown, cookie?: string) {
  const res = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', Origin: BASE, ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const setCookie = res.headers.get('set-cookie')?.split(';')[0];
  return { status: res.status, body: await res.json().catch(() => ({})), cookie: setCookie };
}
const sessions: Record<string, string> = {}; // sign-in is rate limited (10 per 15 min), so reuse sessions
const login = async (email: string, pw: string) => {
  if (sessions[email]) return sessions[email];
  const r = await api('POST', '/api/auth/login', { email, password: pw });
  assert.equal(r.status, 200);
  return (sessions[email] = r.cookie!);
};
async function signup(name: string, email: string, familyName: string) {
  const s = await api('POST', '/api/auth/register/start', { name, email, password: 'correct-horse-1', familyName });
  assert.equal(s.status, 200);
  for (let i = 0; i < 50 && !codes[email]; i++) await new Promise((r) => setTimeout(r, 100));
  return codes[email];
}

before(async () => {
  // A legacy single-family database, to exercise the migration too.
  fs.writeFileSync(path.join(dir, 'db.json'), JSON.stringify({
    familyvault_members_v1: [member('owner', 'owner', 'owner@old.test'), member('admin', 'admin', 'admin@old.test'), member('mallory', 'member', 'm@old.test'), member('nina', 'member', 'n@old.test')],
    familyvault_files_v1: [file('pub', 'owner', 'family'), file('mallory-private', 'mallory', 'private'), file('nina-file', 'nina', 'family')],
    familyvault_folders_v1: [], familyvault_notifications_v1: [],
    familyvault_workspace_v1: { id: 'w', name: 'Old Family', ownerId: 'owner', preferences: { fileDeletionPermissions: 'owner_admin' } },
    familyvault_drive_connection_v1: { isConnected: false },
    __private: { secret: 'x', credentials: { owner: cred('old-owner-pass'), admin: cred('111111'), mallory: cred('222222'), nina: cred('333333') }, invites: {}, archive: {}, lock: {}, sv: {}, drive: null },
  }));
  child = spawn('npx', ['tsx', 'server/index.ts'], {
    env: { ...process.env, DATABASE_URL: '', GOOGLE_CLIENT_ID: '', RESEND_API_KEY: '', NODE_ENV: 'development', PORT: String(PORT), APP_URL: BASE, DATA_DIR: dir, SESSION_SECRET: 'test-secret' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout!.on('data', (d) => { for (const m of String(d).matchAll(/verification code for (\S+): (\d{6})/g)) codes[m[1]] = m[2]; });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 150)); }
  throw new Error('server did not start');
});
after(() => { child?.kill(); fs.rmSync(dir, { recursive: true, force: true }); });

describe('migration of the single-family layout', () => {
  it('keeps existing accounts and data working', async () => {
    const c = await login('owner@old.test', 'old-owner-pass');
    const st = await api('GET', '/api/state', undefined, c);
    assert.equal(st.body.familyvault_workspace_v1.name, 'Old Family');
    assert.equal(st.body.familyvault_files_v1.length, 3); // owner sees everything
  });
});

describe('verified signup', () => {
  it('the old open register endpoint is gone', async () => {
    assert.equal((await api('POST', '/api/auth/register', { name: 'x', email: 'x@x.co', password: 'password123' })).status, 404);
  });
  it('rejects a wrong code, accepts the emailed one, and creates an owner', async () => {
    const code = await signup('Alice A', 'alice@a.test', 'Alice Family');
    assert.match(code, /^\d{6}$/);
    const wrong = await api('POST', '/api/auth/register/verify', { email: 'alice@a.test', code: code === '000000' ? '111111' : '000000' });
    assert.equal(wrong.status, 400);
    const ok = await api('POST', '/api/auth/register/verify', { email: 'alice@a.test', code });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.role, 'owner');
    sessions['alice@a.test'] = ok.cookie!;
    const me = await api('GET', '/api/auth/me', undefined, ok.cookie);
    assert.equal(me.status, 200);
  });
});

describe('families are isolated', () => {
  it('a second family gets its own empty workspace and cannot see the first', async () => {
    const code = await signup('Bob B', 'bob@b.test', 'Bob Family');
    const b = await api('POST', '/api/auth/register/verify', { email: 'bob@b.test', code });
    assert.equal(b.status, 200);
    const st = await api('GET', '/api/state', undefined, b.cookie);
    assert.equal(st.body.familyvault_workspace_v1.name, 'Bob Family');
    assert.equal(st.body.familyvault_members_v1.length, 1);
    assert.equal(st.body.familyvault_files_v1.length, 0);
    assert.ok(!JSON.stringify(st.body).includes('Old Family'));
  });
  it("one family's writes never reach another", async () => {
    const a = await login('owner@old.test', 'old-owner-pass');
    const put = await api('PUT', '/api/state/familyvault_folders_v1', { value: [{ id: 'f1', name: 'Secret trip' }] }, a);
    assert.equal(put.status, 200);
    const alice = await api('GET', '/api/state', undefined, sessions['alice@a.test']);
    assert.deepEqual(alice.body.familyvault_folders_v1, []);
    const again = await api('GET', '/api/state', undefined, a);
    assert.equal(again.body.familyvault_folders_v1[0].name, 'Secret trip');
  });
  it('emails are unique across families', async () => {
    const a = await login('admin@old.test', '111111');
    const r = await api('POST', '/api/invites', { email: 'bob@b.test' }, a);
    assert.equal(r.status, 409);
  });
  it('rejects malformed invite emails and unknown state keys', async () => {
    const a = await login('owner@old.test', 'old-owner-pass');
    assert.equal((await api('POST', '/api/invites', { email: { not: 'a string' } }, a)).status, 400);
    assert.equal((await api('PUT', '/api/state/familyvault_junk_v1', { value: 'x'.repeat(100) }, a)).status, 400);
  });
});

describe('file edits through the shared state endpoint', () => {
  it("a member can star files even when someone else's private file is hidden from them", async () => {
    const n = await login('n@old.test', '333333');
    const st = await api('GET', '/api/state', undefined, n);
    const files: any[] = st.body.familyvault_files_v1;
    assert.ok(!files.some((f) => f.id === 'mallory-private'));
    const next = files.map((f) => (f.id === 'pub' ? { ...f, isFavorite: true } : f));
    assert.equal((await api('PUT', '/api/state/familyvault_files_v1', { value: next }, n)).status, 200);
    const owner = await login('owner@old.test', 'old-owner-pass');
    const all: any[] = (await api('GET', '/api/state', undefined, owner)).body.familyvault_files_v1;
    assert.ok(all.some((f) => f.id === 'mallory-private'), 'hidden file record must survive');
    assert.equal(all.find((f) => f.id === 'pub').isFavorite, true);
  });
  it('a non-uploader cannot rename, but the uploader can', async () => {
    const n = await login('n@old.test', '333333');
    const files: any[] = (await api('GET', '/api/state', undefined, n)).body.familyvault_files_v1;
    await api('PUT', '/api/state/familyvault_files_v1', { value: files.map((f) => (f.id === 'pub' ? { ...f, name: 'hacked.jpg' } : f)) }, n);
    const owner = await login('owner@old.test', 'old-owner-pass');
    assert.equal(((await api('GET', '/api/state', undefined, owner)).body.familyvault_files_v1 as any[]).find((f) => f.id === 'pub').name, 'pub.jpg');
  });
  it("a member cannot delete someone else's file", async () => {
    const n = await login('n@old.test', '333333');
    const files: any[] = (await api('GET', '/api/state', undefined, n)).body.familyvault_files_v1;
    assert.equal((await api('PUT', '/api/state/familyvault_files_v1', { value: files.filter((f) => f.id !== 'pub') }, n)).status, 403);
  });
});

describe('reset links', () => {
  it('an admin never receives a member\'s sign-in link when email cannot be sent', async () => {
    const a = await login('admin@old.test', '111111');
    const r = await api('POST', '/api/members/nina/reset-credentials', {}, a);
    assert.equal(r.status, 200);
    assert.equal(r.body.emailed, false);
    assert.equal(r.body.resetUrl, undefined);
  });
});
