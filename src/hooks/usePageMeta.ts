import { useEffect } from 'react';
import { siteConfig } from '../config/site';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}

/** Sets title, description, canonical and Open Graph tags for a public page. */
export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const full = title === siteConfig.name ? `${siteConfig.name} — Private family archive` : `${title} — ${siteConfig.name}`;
    document.title = full;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', `${siteConfig.url}${path}`);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = `${siteConfig.url}${path}`;
    window.scrollTo(0, 0);
  }, [title, description, path]);
}
