import express from 'express';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import { APP_URL, IS_PROD, PORT, ROOT } from './config.ts';
import { initStore } from './store.ts';
import { rateLimit, sameOriginOnly, securityHeaders } from './security.ts';
import { router as authRouter } from './routes/auth.ts';
import { router as invitesRouter } from './routes/invites.ts';
import { router as driveRouter } from './routes/drive.ts';
import { router as filesRouter } from './routes/files.ts';
import { router as stateRouter } from './routes/state.ts';

async function start() {
  await initStore();
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
  app.use(securityHeaders);
  app.use(express.json({ limit: '5mb' }));

  const api = express.Router();
  api.use(sameOriginOnly);
  const authLimit = rateLimit('auth', 10, 15 * 60e3);
  api.use(['/auth/login', '/auth/register', '/auth/accept-invite', '/auth/reset', '/auth/change-secret'], authLimit);
  api.use('/auth/register/start', rateLimit('register-start', 5, 60 * 60e3)); // each call can send an email
  api.use('/auth/forgot', rateLimit('forgot', 5, 60 * 60e3));
  api.use('/members', rateLimit('member-reset', 30, 60 * 60e3));
  api.use('/invites', rateLimit('invites', 30, 60 * 60e3));
  api.get('/health', (_req, res) => res.json({ ok: true, driveConfigured: !!process.env.GOOGLE_CLIENT_ID }));
  api.use(authRouter);
  api.use(invitesRouter);
  api.use(driveRouter);
  api.use(filesRouter);
  api.use(stateRouter);
  app.use('/api', api);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err?.message || err);
  const status =
    err?.status ||
    (typeof err?.code === 'number' && err.code >= 400 && err.code < 600 ? err.code : undefined) ||
    err?.response?.status ||
    500;
  const message =
    err?.response?.data?.error_description ||
    err?.response?.data?.error?.message ||
    err?.message ||
    'Server error';
  res.status(status).json({ error: message });
});

if (IS_PROD) {
  const dist = path.join(ROOT, 'dist');
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.listen(PORT, '0.0.0.0', () => console.log(`FamilyVault running on ${APP_URL}`));
}
start();
