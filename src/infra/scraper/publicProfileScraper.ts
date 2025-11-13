import type { Contact } from '../../domain/types';

export interface ScrapedProfile {
  fields: Partial<Contact>;
  avatarUrl?: string;
  raw: string;
  meta?: Record<string, string>;
}

export async function scrapePublicProfile(url: string): Promise<ScrapedProfile> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const html = await res.text();
    // very naive extraction of og tags
    const og = Object.fromEntries(Array.from(html.matchAll(/<meta[^>]+property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi)).map(m => [m[1], m[2]]));
    const title = og['title'] || '';
    const image = og['image'];
    const fields: Partial<Contact> = {};
    if (title) {
      const parts = title.split(' ');
      fields.firstName = parts[0] || '';
      fields.lastName = parts.slice(1).join(' ');
    }
    return { fields, avatarUrl: image, raw: html, meta: og };
  } catch {
    // Fallback mock for offline/CORS cases
    return {
      fields: { organization: 'Company Inc', position: 'Position' },
      avatarUrl: undefined,
      raw: '<offline/>',
      meta: { error: 'cors_or_offline' },
    };
  }
}

