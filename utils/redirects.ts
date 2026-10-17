import type { APIRequestContext } from '@playwright/test';

export interface RedirectHop {
  url: string;
  status: number;
}

export interface RedirectChain {
  hops: RedirectHop[];
  /** Where the chain ended: the last HTTP URL, or a non-HTTP target such as `intent://`. */
  finalUrl: string;
  finalStatus: number | null;
}

/**
 * Follows a redirect chain one hop at a time with a given User-Agent.
 * Smart links (App Store / Play / intent) branch on UA and can end in a non-HTTP scheme the
 * browser cannot load, so hops are followed manually instead of with `page.goto`.
 */
export async function followRedirects(
  request: APIRequestContext,
  startUrl: string,
  userAgent: string,
  maxHops = 8,
): Promise<RedirectChain> {
  const hops: RedirectHop[] = [];
  let url = startUrl;
  for (let i = 0; i < maxHops; i++) {
    const res = await request.get(url, { maxRedirects: 0, headers: { 'user-agent': userAgent } });
    hops.push({ url, status: res.status() });
    const location = res.headers()['location'];
    if (res.status() < 300 || res.status() >= 400 || !location) {
      return { hops, finalUrl: url, finalStatus: res.status() };
    }
    url = new URL(location, url).href;
    if (!/^https?:/.test(url)) return { hops, finalUrl: url, finalStatus: null };
  }
  return { hops, finalUrl: url, finalStatus: null };
}
