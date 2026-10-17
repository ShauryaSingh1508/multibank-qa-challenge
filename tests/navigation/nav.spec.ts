import { test, expect } from '../../fixtures/test';
import { localePathPattern } from '../../config/env';
import nav from '../../data/nav-items.json';
import viewports from '../../data/viewports.json';

const allLabels = [...nav.mainNav.map((i) => i.label), ...nav.externalNav.map((i) => i.label)];

test.describe('Navigation & layout', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('NAV-01 top navigation renders every expected item @smoke', async ({ homePage }) => {
    const { header } = homePage;
    await expect(header.logo).toBeVisible();
    await expect(header.mainNav).toBeVisible();

    // Order matters to users and to the design spec, so compare the full list, not a subset.
    expect(await header.navLabels()).toEqual(allLabels);
    for (const label of allLabels) {
      await expect(header.navLink(label), `${label} should be visible`).toBeVisible();
    }
    for (const { label } of nav.authButtons) {
      await expect(header.authLink(label)).toBeVisible();
    }
  });

  test.describe('NAV-02 each navigation item opens the correct destination @smoke', () => {
    for (const item of nav.mainNav) {
      test(`${item.label} -> ${item.path}`, async ({ homePage, page }) => {
        await homePage.header.clickNavItem(item.label);

        await expect(page).toHaveURL((url) => localePathPattern(item.path).test(url.pathname));
        await expect(page).toHaveTitle(new RegExp(item.title));
        await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(item.heading);
      });
    }

    for (const item of nav.externalNav) {
      test(`${item.label} opens the token site in a new tab`, async ({ homePage, context }) => {
        const link = homePage.header.navLink(item.label);
        await expect(link).toHaveAttribute('href', item.href);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);

        const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
        await popup.waitForLoadState('domcontentloaded');
        // The legacy token domain redirects to the new brand domain; either is a correct landing.
        expect(item.landingHosts).toContain(new URL(popup.url()).host);
      });
    }

    // Auth CTAs point at the trading app. Only the target is checked: the brief rules out
    // interacting with account flows, so the suite never loads the login/register forms.
    for (const item of nav.authButtons) {
      test(`${item.label} points to the trading app`, async ({ homePage }) => {
        const link = homePage.header.authLink(item.label);
        await expect(link).toHaveAttribute('href', item.href);
        await expect(link).toHaveAttribute('target', '_blank');
      });
    }

    test('logo returns to the home page', async ({ spotTradingPage, page }) => {
      await spotTradingPage.open();
      await spotTradingPage.header.logo.click();
      await expect(page).toHaveURL((url) => localePathPattern('').test(url.pathname));
    });
  });

  test.describe('NAV-03 navigation at standard desktop viewports @regression', () => {
    for (const vp of viewports.desktop) {
      test.describe(`${vp.name} ${vp.width}x${vp.height}`, () => {
        test.use({ viewport: { width: vp.width, height: vp.height } });

        test('full nav is shown, no hamburger, no sideways scroll', async ({ homePage }) => {
          const { header } = homePage;
          await expect(header.mainNav).toBeVisible();
          await expect(header.menuButton).toBeHidden();
          for (const label of allLabels) {
            await expect(header.navLink(label)).toBeInViewport();
          }
          expect(await homePage.hasHorizontalOverflow()).toBe(false);
        });

        test('header stays pinned to the top while scrolling', async ({ homePage, page }) => {
          await page.mouse.wheel(0, 2000);
          await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
          await expect(homePage.header.root).toBeInViewport();
          const box = await homePage.header.root.boundingBox();
          expect(box?.y ?? -1).toBeLessThanOrEqual(1);
        });
      });
    }
  });
});
