import { test, expect } from '../../fixtures/test';
import nav from '../../data/nav-items.json';
import viewports from '../../data/viewports.json';

const allLabels = [...nav.mainNav.map((i) => i.label), ...nav.externalNav.map((i) => i.label)];

/** Runs in the mobile-chrome / mobile-safari projects (real device descriptors: touch, DPR, UA). */
test.describe('Negative - mobile breakpoint regression @mobile', () => {
  for (const vp of viewports.mobile) {
    test.describe(`${vp.name} ${vp.width}px`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('NEG-03a desktop nav collapses into a working hamburger menu', async ({ homePage }) => {
        await homePage.open();
        const { header } = homePage;
        await expect(header.mainNav).toBeHidden();
        await expect(header.menuButton).toBeVisible();

        await header.openMobileMenu();
        for (const label of allLabels) {
          await expect(header.mobileNavLink(label), label).toBeVisible();
        }
        await header.closeMobileMenu();
        await expect(header.mobileMenu).toBeHidden();
      });

      test('NEG-03b mobile menu navigates to a page', async ({ homePage, spotTradingPage }) => {
        await homePage.open();
        await homePage.header.openMobileMenu();
        await homePage.header.mobileNavLink('Explore').click();
        await expect(spotTradingPage.heading).toBeVisible();
        await expect(homePage.header.mobileMenu).toBeHidden();
      });

      test('NEG-03c key pages have no horizontal overflow', async ({
        homePage,
        spotTradingPage,
        whyMultiBankPage,
      }) => {
        for (const po of [homePage, spotTradingPage, whyMultiBankPage]) {
          await po.open();
          expect(await po.hasHorizontalOverflow(), `${po.url} overflows sideways`).toBe(false);
        }
      });

      test('NEG-03d spot market stays usable', async ({ spotTradingPage }) => {
        await spotTradingPage.open();
        await spotTradingPage.waitForRows();
        await spotTradingPage.selectCategory('Losers');
        await expect(spotTradingPage.rows.first()).toBeVisible();
        const box = (await spotTradingPage.table.boundingBox())!;
        expect(box.width).toBeLessThanOrEqual(vp.width);
      });
    });
  }
});
