import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SpotTradingPage } from '../pages/SpotTradingPage';
import { WhyMultiBankPage } from '../pages/WhyMultiBankPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { CoinDetailPage } from '../pages/CoinDetailPage';
import { MarketApi } from '../api/MarketApi';

/**
 * Third-party scripts that add network noise, overlays (live chat bubble) or analytics hits
 * from a test runner, but have no bearing on the behaviour under test.
 */
const THIRD_PARTY_BLOCKLIST =
  /livechatinc\.com|googletagmanager\.com|google-analytics\.com|doubleclick\.net|analytics\.tiktok\.com|connect\.facebook\.net|sentry\.io|google\.com\/(rmkt|pagead)|google\.ae\/pagead/;

interface PageObjects {
  homePage: HomePage;
  spotTradingPage: SpotTradingPage;
  whyMultiBankPage: WhyMultiBankPage;
  notFoundPage: NotFoundPage;
  coinDetailPage: CoinDetailPage;
  marketApi: MarketApi;
}

interface Hooks {
  blockThirdParty: void;
  dismissConsent: void;
  /** Uncaught page errors collected during the test; attached to the report when non-empty. */
  pageErrors: string[];
}

export const test = base.extend<PageObjects & Hooks>({
  blockThirdParty: [
    async ({ context }, use) => {
      await context.route(THIRD_PARTY_BLOCKLIST, (route) => route.abort());
      await use();
    },
    { auto: true },
  ],

  /**
   * Cookie consent (Cookiebot) is shown only in some regions. Rather than a one-off click that
   * races the banner, a locator handler dismisses it whenever it blocks an action.
   */
  dismissConsent: [
    async ({ page }, use) => {
      const banner = page.locator('#CybotCookiebotDialog');
      await page.addLocatorHandler(banner, async () => {
        await banner
          .getByRole('button', { name: /necessary|decline|deny|reject/i })
          .first()
          .click();
      });
      await use();
    },
    { auto: true },
  ],

  pageErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await use(errors);
      if (errors.length) {
        await testInfo.attach('page-errors', { body: errors.join('\n'), contentType: 'text/plain' });
      }
    },
    { auto: true },
  ],

  homePage: async ({ page }, use) => use(new HomePage(page)),
  spotTradingPage: async ({ page }, use) => use(new SpotTradingPage(page)),
  whyMultiBankPage: async ({ page }, use) => use(new WhyMultiBankPage(page)),
  notFoundPage: async ({ page }, use) => use(new NotFoundPage(page)),
  coinDetailPage: async ({ page }, use) => use(new CoinDetailPage(page)),
  marketApi: async ({ request }, use) => use(new MarketApi(request)),
});

export { expect };
