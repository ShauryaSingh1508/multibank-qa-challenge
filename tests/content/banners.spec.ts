import { test, expect } from '../../fixtures/test';
import banners from '../../data/banners.json';

test.describe('Content - marketing banners', () => {
  test('BAN-01a home hero banner renders above the fold, below the header @regression', async ({
    homePage,
    page,
  }) => {
    await homePage.open();
    await expect(homePage.heroBanner).toBeVisible();
    await expect(homePage.heroHeading).toBeInViewport();
    for (const cta of banners.home.ctas) {
      await expect(homePage.heroCta(cta)).toBeVisible();
    }

    // "Expected region": the hero is the first content block and starts where the header ends.
    const header = (await homePage.header.root.boundingBox())!;
    const hero = (await homePage.heroBanner.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(hero.y).toBeGreaterThanOrEqual(header.y + header.height - 2);
    expect(hero.y).toBeLessThan(viewport.height / 2);
    expect(await homePage.brokenImages(homePage.heroBanner)).toEqual([]);
  });

  test('BAN-01b Explore promo banners render between the page title and the spot market @regression', async ({
    spotTradingPage,
  }) => {
    await spotTradingPage.open();
    const title = (await spotTradingPage.heading.boundingBox())!;
    const spot = (await spotTradingPage.spotSection.boundingBox())!;

    for (const text of banners.explore.promoCards) {
      const card = spotTradingPage.promoCard(text);
      await expect(card, `${text} banner`).toBeVisible();
      const box = (await card.boundingBox())!;
      expect(box.y, `${text} sits below the title`).toBeGreaterThan(title.y + title.height);
      expect(box.y, `${text} sits above the spot market`).toBeLessThan(spot.y);
    }

    // Cards share one row (desktop), so their tops line up within a few pixels.
    const tops = await Promise.all(
      banners.explore.promoCards.map(async (t) => (await spotTradingPage.promoCard(t).boundingBox())!.y),
    );
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(40);
    expect(await spotTradingPage.brokenImages(spotTradingPage.promoStrip)).toEqual([]);
  });
});
