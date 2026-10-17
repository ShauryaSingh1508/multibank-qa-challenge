import type { APIRequestContext } from '@playwright/test';

export interface LinkResult {
  url: string;
  status: number | null;
  ok: boolean;
  note?: string;
}

export interface LinkCheckOptions {
  /** Parallel requests; kept low so the suite is a polite client of a production site. */
  concurrency?: number;
  timeoutMs?: number;
  /** Hosts behind bot protection that answer automated clients with 403/429. Reported, not failed. */
  botProtectedHosts?: string[];
}

/** Resolves page-relative hrefs, drops non-HTTP schemes and duplicates. */
export function normaliseLinks(hrefs: (string | null)[], pageUrl: string): string[] {
  const urls = hrefs
    .filter((h): h is string => !!h && !/^(mailto:|tel:|javascript:|#)/.test(h))
    .map((h) => new URL(h, pageUrl).href.replace(/#.*$/, ''));
  return [...new Set(urls)];
}

/**
 * Requests each URL (GET, redirects followed) and classifies the result.
 * GET rather than HEAD because several CDNs answer HEAD with 403/405 while the page itself is fine.
 */
export async function checkLinks(
  request: APIRequestContext,
  urls: string[],
  { concurrency = 4, timeoutMs = 20_000, botProtectedHosts = [] }: LinkCheckOptions = {},
): Promise<LinkResult[]> {
  const results: LinkResult[] = [];
  const queue = [...urls];

  async function worker() {
    for (let url = queue.shift(); url; url = queue.shift()) {
      results.push(await checkOne(request, url, timeoutMs, botProtectedHosts));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results.sort((a, b) => a.url.localeCompare(b.url));
}

async function checkOne(
  request: APIRequestContext,
  url: string,
  timeout: number,
  botProtectedHosts: string[],
): Promise<LinkResult> {
  // One retry on network errors only: a transient socket reset is not a broken link.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await request.get(url, { timeout, maxRedirects: 10, failOnStatusCode: false });
      const status = res.status();
      const host = new URL(url).host;
      if ((status === 403 || status === 429) && botProtectedHosts.includes(host)) {
        return { url, status, ok: true, note: 'bot-protected host; verify manually' };
      }
      return { url, status, ok: status < 400 };
    } catch (error) {
      if (attempt === 2)
        return { url, status: null, ok: false, note: (error as Error).message.split('\n')[0] };
    }
  }
  return { url, status: null, ok: false };
}
