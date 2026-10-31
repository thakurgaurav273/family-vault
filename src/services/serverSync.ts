// Backend persistence layer: hydrates localStorage from the server on boot and
// mirrors every shared-key write back to it. Per-device keys stay local.
const LOCAL_ONLY = new Set(['familyvault_current_user_v1', 'familyvault_theme']);
const isShared = (k: string) => k.startsWith('familyvault_') && !LOCAL_ONLY.has(k);

export async function hydrateFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const state: Record<string, unknown> = await res.json();
      for (const [k, v] of Object.entries(state)) {
        if (isShared(k)) localStorage.setItem(k, JSON.stringify(v));
      }
    }
  } catch {
    console.warn('Backend unreachable; running from local cache only.');
  }

  const origSet = Storage.prototype.setItem;
  const origRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k: string, v: string) {
    origSet.call(this, k, v);
    if (this === localStorage && isShared(k)) {
      let value: unknown;
      try { value = JSON.parse(v); } catch { return; }
      fetch(`/api/state/${k}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      }).catch(() => {});
    }
  };
  Storage.prototype.removeItem = function (k: string) {
    origRemove.call(this, k);
    if (this === localStorage && isShared(k)) {
      fetch(`/api/state/${k}`, { method: 'DELETE' }).catch(() => {});
    }
  };
}
