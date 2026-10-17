# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: content/app-links.spec.ts >> Content - app download link targets @api >> APP-03b desktop Safari visitors land on a working store page @regression @known-issue
- Location: tests/content/app-links.spec.ts:58:10

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Test source

```ts
  1  | import { devices } from '@playwright/test';
  2  | import { test, expect } from '../../fixtures/test';
  3  | import { test as apiTest } from '../../fixtures/api';
  4  | import { env } from '../../config/env';
  5  | import { followRedirects } from '../../utils/redirects';
  6  | import { knownIssue } from '../../utils/known-issue';
  7  | import app from '../../data/app-links.json';
  8  | 
  9  | /**
  10 |  * The "Download the app" CTA is a smart link that branches on the visitor's User-Agent.
  11 |  * Each platform is checked by following the redirect chain with that platform's UA, which is
  12 |  * deterministic and does not depend on the store page rendering in a desktop test browser.
  13 |  */
  14 | test.describe('Content - app download link CTA', () => {
  15 |   test('APP-00 home CTA uses the smart link and opens in a new tab @regression', async ({ homePage }) => {
  16 |     await homePage.open();
  17 |     await expect(homePage.downloadAppLink).toHaveAttribute('href', env.appSmartLink);
  18 |     await expect(homePage.downloadAppLink).toHaveAttribute('target', '_blank');
  19 |     await expect(homePage.downloadAppLink).toHaveAttribute('rel', /noopener/);
  20 |   });
  21 | });
  22 | 
  23 | // Redirect checks are plain HTTP, so they run once in the browserless `api` project.
  24 | apiTest.describe('Content - app download link targets @api', () => {
  25 |   apiTest('APP-01 iPhone visitors are sent to the App Store listing @regression', async ({ request }) => {
  26 |     const chain = await followRedirects(request, env.appSmartLink, devices['iPhone 13'].userAgent);
  27 |     const target = chain.hops.find((h) => new URL(h.url).host === app.appStore.host);
  28 |     expect(target, `chain: ${JSON.stringify(chain.hops)}`).toBeDefined();
  29 |     expect(target!.url).toContain(app.appStore.appId);
  30 | 
  31 |     // The listing itself (regional storefront) resolves and is the mb.io app.
  32 |     const listing = await request.get(app.appStore.listingUrl);
  33 |     expect(listing.status()).toBe(200);
  34 |     expect(await listing.text()).toContain(app.listingTitle);
  35 |   });
  36 | 
  37 |   apiTest('APP-02 Android visitors are sent to the Google Play listing @regression', async ({ request }) => {
  38 |     const chain = await followRedirects(request, env.appSmartLink, devices['Pixel 7'].userAgent);
  39 |     // Android gets an intent:// URL that opens the app if installed, with Play as the browser fallback.
  40 |     expect(chain.finalUrl).toMatch(/^intent:\/\//);
  41 |     expect(chain.finalUrl).toContain(`package=${app.googlePlay.packageId}`);
  42 | 
  43 |     const fallback = decodeURIComponent(/S\.browser_fallback_url=([^;]+)/.exec(chain.finalUrl)?.[1] ?? '');
  44 |     expect(new URL(fallback).host).toBe(app.googlePlay.host);
  45 |     expect(new URL(fallback).searchParams.get('id')).toBe(app.googlePlay.packageId);
  46 | 
  47 |     const listing = await request.get(app.googlePlay.listingUrl);
  48 |     expect(listing.status()).toBe(200);
  49 |     expect(await listing.text()).toContain(app.listingTitle);
  50 |   });
  51 | 
  52 |   apiTest('APP-03a desktop Chrome visitors land on a working store page @regression', async ({ request }) => {
  53 |     const chain = await followRedirects(request, env.appSmartLink, devices['Desktop Chrome'].userAgent);
  54 |     expect(chain.finalStatus, `chain: ${JSON.stringify(chain.hops)}`).toBe(200);
  55 |     expect(new URL(chain.finalUrl).host).toBe(app.googlePlay.host);
  56 |   });
  57 | 
  58 |   apiTest(
  59 |     'APP-03b desktop Safari visitors land on a working store page @regression @known-issue',
  60 |     async ({ request }, testInfo) => {
  61 |       knownIssue(
  62 |         testInfo,
  63 |         'OBS-05',
  64 |         'desktop Safari is sent to the storefront-less App Store URL, which returns 404',
  65 |       );
  66 |       const chain = await followRedirects(request, env.appSmartLink, devices['Desktop Safari'].userAgent);
  67 |       await testInfo.attach('redirect-chain', {
  68 |         body: JSON.stringify(chain, null, 2),
  69 |         contentType: 'application/json',
  70 |       });
> 71 |       expect(chain.finalStatus).toBe(200);
     |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  72 |     },
  73 |   );
  74 | });
  75 | 
```