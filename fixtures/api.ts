import { test as base, expect } from '@playwright/test';
import { MarketApi } from '../api/MarketApi';

/** Browserless fixture set for @api specs: no page, no auto page hooks, so no browser is launched. */
export const test = base.extend<{ marketApi: MarketApi }>({
  marketApi: async ({ request }, use) => use(new MarketApi(request)),
});

export { expect };
