import type { Page, Response } from '@playwright/test';

/**
 * Starts waiting for a GET response whose URL contains `urlPart`. Call it *before* the action
 * that triggers the request, then await the result, so the UI and the data it rendered come
 * from the same page load (no second, possibly different, API call).
 */
export function waitForJson<T>(page: Page, urlPart: string): Promise<T> {
  return page
    .waitForResponse((r: Response) => r.url().includes(urlPart) && r.request().method() === 'GET' && r.ok())
    .then((r) => r.json() as Promise<T>);
}

/**
 * Records every JSON body for GET responses matching `urlPart`. Use when a page fetches the
 * same endpoint more than once (initial load + refresh) and the UI shows the most recent one.
 */
export class JsonRecorder<T> {
  private readonly bodies: T[] = [];

  constructor(page: Page, urlPart: string) {
    page.on('response', async (r) => {
      if (!r.url().includes(urlPart) || r.request().method() !== 'GET' || !r.ok()) return;
      try {
        this.bodies.push((await r.json()) as T);
      } catch {
        // Body unavailable (navigation away / aborted); ignore.
      }
    });
  }

  get latest(): T | undefined {
    return this.bodies.at(-1);
  }

  get count(): number {
    return this.bodies.length;
  }
}
