import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {hydrateFromServer} from './services/serverSync.ts';
import {setSignedIn} from './utils/session.ts';

// Pages anyone can open without signing in (landing, privacy policy, terms).
const PUBLIC_PATHS = new Set(['/', '/privacy', '/terms']);

// Without a session, drop any cached family data so a different account on this browser can't see it.
function clearCachedFamilyData() {
  for (const k of Object.keys(localStorage)) if (k.startsWith('familyvault_') && k !== 'familyvault_theme') localStorage.removeItem(k);
}

async function boot() {
  const me = await fetch('/api/auth/me').catch(() => null);
  const isPublic = PUBLIC_PATHS.has(location.pathname.replace(/\/+$/, '') || '/');
  if (me?.ok) {
    localStorage.setItem('familyvault_current_user_v1', JSON.stringify(await me.json()));
    setSignedIn(true);
    await hydrateFromServer();
  } else if (!isPublic && !location.pathname.startsWith('/auth')) {
    clearCachedFamilyData();
    const { hasOwner } = await fetch('/api/auth/status').then((r) => r.json()).catch(() => ({ hasOwner: true }));
    location.replace(hasOwner ? '/auth' : '/auth?mode=register');
    return;
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
boot();
