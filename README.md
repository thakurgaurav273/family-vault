# FamilyVault

A private home for your family's photos, videos and documents. Files are stored in the **owner's own Google Drive**, so the family keeps full ownership of its data. Invited members upload into that Drive through the app.

## How it works

- Anyone can create a family vault. They confirm their email with a 6-digit code (sent through Resend), then become that vault's owner. Each family's data is kept separate on one deployment.
- The owner connects their Google Drive (a `FamilyVault - <family name>` folder is created; the app only touches files it creates).
- The owner invites relatives by email. Members sign in with a **6-digit PIN**; the owner uses a password.
- Uploads are streamed straight to Google Drive. Nothing is stored on the server's disk.
- App data (members, folders, file records) lives in Postgres (Neon), or in `data/db.json` when no database is configured.

## Stack

React 19 + Vite + Tailwind (frontend) · Express 5 (backend) · Postgres/Neon · Google Drive API · Resend (invitation and reset emails)

## Run locally

**Prerequisites:** Node.js 22+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill it in (see below).
3. Start both servers: `npm run dev`
   - Frontend: http://localhost:5173
   - API: http://localhost:5174 (Vite proxies `/api` to it)

Set `APP_URL=http://localhost:5173` for local development.

### Environment variables

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client (Web application) with the Drive API enabled |
| `APP_URL` | Public URL of the app, no trailing slash |
| `DATABASE_URL` | Neon connection string (optional locally; required in production) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email sending; `EMAIL_FROM` must use a domain verified in Resend. **Required in production**: signup verification codes are sent this way, and signup is refused without it |
| `SESSION_SECRET` | Signs sessions: `openssl rand -hex 32` |
| `TRUST_PROXY` | Set to `1` behind a reverse proxy so rate limiting sees real IPs |
| `MAX_UPLOAD_MB` | Per-file upload limit (default 2048) |

### Google Cloud setup

1. Create an OAuth client of type **Web application**.
2. Add this authorized redirect URI: `<APP_URL>/api/drive/callback` (for local: `http://localhost:5173/api/drive/callback`).
3. Enable the **Google Drive API**.
4. While the OAuth app is in *Testing* mode, add the owner's Google account under **Test users**.

Scopes used: `drive.file`, `userinfo.email`, `userinfo.profile`.

## Deploy

The production build is a single Node process that serves the API and the built frontend, so one service is enough.

- **Build:** `npm install --include=dev && npm run build`
- **Start:** `npm start`
- **Health check:** `/api/health`

`render.yaml` is a ready-made [Render](https://render.com) Blueprint. Add `<APP_URL>/api/drive/callback` as a redirect URI in Google Cloud for the live URL, and set `NODE_ENV=production` and `TRUST_PROXY=1`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API and frontend with hot reload |
| `npm run build` | Build the frontend into `dist/` |
| `npm start` | Run in production mode |
| `npm run lint` | Type-check with `tsc` |

## Tests

`npm test` boots the server against a throwaway data directory (never your real database) and checks signup verification, family isolation, the single-family data migration and file-permission rules.
