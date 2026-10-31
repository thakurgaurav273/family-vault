import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {hydrateFromServer} from './services/serverSync.ts';

async function boot() {
  const me = await fetch('/api/auth/me').catch(() => null);
  if (me?.ok) {
    localStorage.setItem('familyvault_current_user_v1', JSON.stringify(await me.json()));
    await hydrateFromServer();
  } else if (!location.pathname.startsWith('/auth')) {
    const { hasOwner } = await fetch('/api/auth/status').then((r) => r.json()).catch(() => ({ hasOwner: true }));
    location.replace(hasOwner ? '/auth' : '/auth?mode=register');
    return;
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
boot();
