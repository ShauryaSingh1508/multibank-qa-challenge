import { test, expect } from '../../fixtures/test';
import { localePathPattern } from '../../config/env';
import content from '../../data/why-multibank.json';

test.describe('Content - About Us > Why MultiBank', () => {
  test('WHY-01a is reached from the Company navigation item @smoke', async ({
    homePage,
    whyMultiBankPage,
    page,
  }) => {
    await homePage.open();
    await homePage.header.clickNavItem('Company');
    await expect(page).toHaveURL((url) => localePathPattern(content.path).test(url.pathname));
    await expect(whyMultiBankPage.heading).toBeVisible();
  });

  test.describe('page content', () => {
    test.beforeEach(async ({ whyMultiBankPage }) => {
      await whyMultiBankPage.open();
    });

    test('WHY-01b hero shows the heading, intro and key stats @smoke', async ({ whyMultiBankPage, page }) => {
      await expect(page).toHaveTitle(new RegExp(content.title));
      await expect(whyMultiBankPage.heading).toHaveText(content.heading);
      await expect(whyMultiBankPage.intro).toContainText(content.intro);

      for (const stat of content.stats) {
        await expect(whyMultiBankPage.statValue(stat.value), `stat ${stat.value}`).toBeVisible();
        await expect(whyMultiBankPage.statLabelFor(stat.value)).toHaveText(stat.label);
      }
    });

    test('WHY-01c value sections have the correct headings and body text @regression', async ({
      whyMultiBankPage,
    }) => {
      for (const section of content.sections) {
        const heading = whyMultiBankPage.sectionHeading(section.heading);
        await heading.scrollIntoViewIfNeeded();
        await expect(heading).toBeVisible();
        await expect(whyMultiBankPage.sectionBody(section.heading)).toContainText(section.text);
      }
    });

    test('WHY-01d strength cards and community section render @regression', async ({ whyMultiBankPage }) => {
      const { strength, community } = content;
      await whyMultiBankPage.strengthSection.scrollIntoViewIfNeeded();
      await expect(whyMultiBankPage.heading3(strength.heading)).toBeVisible();
      for (const card of strength.cards) {
        const el = whyMultiBankPage.strengthCard(card.title);
        await expect(el, card.title).toBeVisible();
        await expect(el).toContainText(card.text);
      }
      expect(await whyMultiBankPage.brokenImages(whyMultiBankPage.strengthSection)).toEqual([]);

      const communityHeading = whyMultiBankPage.heading3(community.heading);
      await communityHeading.scrollIntoViewIfNeeded();
      await expect(communityHeading).toBeVisible();
      await expect(whyMultiBankPage.sectionHeading(community.subheading)).toBeVisible();
    });
  });
});
