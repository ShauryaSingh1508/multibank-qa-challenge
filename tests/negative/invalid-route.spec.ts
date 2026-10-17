import { test, expect } from '../../fixtures/test';
import { localePathPattern } from '../../config/env';
import { knownIssue } from '../../utils/known-issue';
import routes from '../../data/invalid-routes.json';

test.describe('Negative - invalid route handling', () => {
  for (const route of routes) {
    test(`NEG-01 ${route.name} returns 404 with a way back home @regression`, async ({ notFoundPage }) => {
      const response = await notFoundPage.openInvalid(route.path);
      // A real 404 status (not a soft 404 with 200) keeps bad URLs out of search indexes and monitors.
      expect(response?.status()).toBe(404);
      await expect(notFoundPage.heading).toBeVisible();
      await expect(notFoundPage.backHomeLink).toBeVisible();
      await expect(notFoundPage.header.mainNav).toBeVisible();
    });
  }

  test('NEG-01b "Back to Homepage" returns to the home page @regression', async ({
    notFoundPage,
    homePage,
    page,
  }) => {
    await notFoundPage.openInvalid(routes[0].path);
    await notFoundPage.backHomeLink.click();
    await expect(page).toHaveURL((url) => localePathPattern('').test(url.pathname));
    await expect(homePage.heroHeading).toBeVisible();
  });

  test('NEG-01c 404 page has a document title @regression @known-issue', async ({
    notFoundPage,
    page,
  }, testInfo) => {
    knownIssue(testInfo, 'OBS-07', '404 page renders with an empty <title>');
    await notFoundPage.openInvalid(routes[0].path);
    await expect(page).toHaveTitle(/\S/);
  });
});
