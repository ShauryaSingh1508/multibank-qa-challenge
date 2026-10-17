import { devices } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import { test as apiTest } from '../../fixtures/api';
import { env } from '../../config/env';
import { followRedirects } from '../../utils/redirects';
import { knownIssue } from '../../utils/known-issue';
import app from '../../data/app-links.json';

/**
 * The "Download the app" CTA is a smart link that branches on the visitor's User-Agent.
 * Each platform is checked by following the redirect chain with that platform's UA, which is
 * deterministic and does not depend on the store page rendering in a desktop test browser.
 */
test.describe('Content - app download link CTA', () => {
  test('APP-00 home CTA uses the smart link and opens in a new tab @regression', async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.downloadAppLink).toHaveAttribute('href', env.appSmartLink);
    await expect(homePage.downloadAppLink).toHaveAttribute('target', '_blank');
    await expect(homePage.downloadAppLink).toHaveAttribute('rel', /noopener/);
  });
});

// Redirect checks are plain HTTP, so they run once in the browserless `api` project.
apiTest.describe('Content - app download link targets @api', () => {
  apiTest('APP-01 iPhone visitors are sent to the App Store listing @regression', async ({ request }) => {
    const chain = await followRedirects(request, env.appSmartLink, devices['iPhone 13'].userAgent);
    const target = chain.hops.find((h) => new URL(h.url).host === app.appStore.host);
    expect(target, `chain: ${JSON.stringify(chain.hops)}`).toBeDefined();
    expect(target!.url).toContain(app.appStore.appId);

    // The listing itself (regional storefront) resolves and is the mb.io app.
    const listing = await request.get(app.appStore.listingUrl);
    expect(listing.status()).toBe(200);
    expect(await listing.text()).toContain(app.listingTitle);
  });

  apiTest('APP-02 Android visitors are sent to the Google Play listing @regression', async ({ request }) => {
    const chain = await followRedirects(request, env.appSmartLink, devices['Pixel 7'].userAgent);
    // Android gets an intent:// URL that opens the app if installed, with Play as the browser fallback.
    expect(chain.finalUrl).toMatch(/^intent:\/\//);
    expect(chain.finalUrl).toContain(`package=${app.googlePlay.packageId}`);

    const fallback = decodeURIComponent(/S\.browser_fallback_url=([^;]+)/.exec(chain.finalUrl)?.[1] ?? '');
    expect(new URL(fallback).host).toBe(app.googlePlay.host);
    expect(new URL(fallback).searchParams.get('id')).toBe(app.googlePlay.packageId);

    const listing = await request.get(app.googlePlay.listingUrl);
    expect(listing.status()).toBe(200);
    expect(await listing.text()).toContain(app.listingTitle);
  });

  apiTest('APP-03a desktop Chrome visitors land on a working store page @regression', async ({ request }) => {
    const chain = await followRedirects(request, env.appSmartLink, devices['Desktop Chrome'].userAgent);
    expect(chain.finalStatus, `chain: ${JSON.stringify(chain.hops)}`).toBe(200);
    expect(new URL(chain.finalUrl).host).toBe(app.googlePlay.host);
  });

  apiTest(
    'APP-03b desktop Safari visitors land on a working store page @regression @known-issue',
    async ({ request }, testInfo) => {
      knownIssue(
        testInfo,
        'OBS-05',
        'desktop Safari is sent to the storefront-less App Store URL, which returns 404',
      );
      const chain = await followRedirects(request, env.appSmartLink, devices['Desktop Safari'].userAgent);
      await testInfo.attach('redirect-chain', {
        body: JSON.stringify(chain, null, 2),
        contentType: 'application/json',
      });
      expect(chain.finalStatus).toBe(200);
    },
  );
});
