import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test';

/** Fonts loaded and JS-driven fade-ins finished, so the frame is stable before capture. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll('header *')].every((el) => Number(getComputedStyle(el).opacity) === 1),
      ),
    )
    .toBe(true);
}

/**
 * Visual regression on static regions only. Anything live (prices, sparklines, tickers,
 * social feeds) is either out of frame or masked, so a diff means the layout changed.
 * Baselines: `npm run test:visual:update`. They are platform-specific (font rendering), so
 * regenerate on the platform that runs them (see README > Visual baselines).
 */
test.describe('Visual regression @visual', () => {
  test('VIS-01a header', async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.header.logo).toBeVisible();
    await settle(homePage.page);
    await expect(homePage.header.root).toHaveScreenshot('header.png');
  });

  test('VIS-01b footer', async ({ homePage }) => {
    await homePage.open();
    await homePage.footer.root.scrollIntoViewIfNeeded();
    await settle(homePage.page);
    await expect(homePage.footer.root).toHaveScreenshot('footer.png');
  });

  test('VIS-01c Why MultiBank hero', async ({ whyMultiBankPage }) => {
    await whyMultiBankPage.open();
    await settle(whyMultiBankPage.page);
    await expect(whyMultiBankPage.hero).toHaveScreenshot('why-multibank-hero.png');
  });

  test('VIS-01d 404 page', async ({ notFoundPage, page }) => {
    await notFoundPage.openInvalid('/visual-check-not-found');
    await expect(page).toHaveScreenshot('not-found.png', { mask: [notFoundPage.header.root] });
  });
});
