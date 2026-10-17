import { test, expect } from '../../fixtures/test';
import { checkLinks, normaliseLinks } from '../../utils/link-checker';

/**
 * Collects every link in the header (desktop nav + auth CTAs) and the footer, then requests
 * each one. One aggregated assertion lists every broken link at once instead of stopping at the first.
 */
test.describe('Negative - broken link detection', () => {
  test('NEG-02 header and footer links all resolve @regression', async ({
    homePage,
    page,
    request,
  }, testInfo) => {
    // Plain HTTP checks: running them once (Chromium) is enough, the result does not depend on the browser.
    test.skip(testInfo.project.name !== 'chromium', 'link health is browser-independent');
    test.setTimeout(120_000);

    await homePage.open();
    const hrefs = [
      ...(await homePage.header.root
        .getByRole('link')
        .evaluateAll((as) => as.map((a) => a.getAttribute('href')))),
      ...(await homePage.footer.links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))),
    ];
    const urls = normaliseLinks(hrefs, page.url());
    expect(urls.length, 'links were collected').toBeGreaterThan(15);

    const results = await checkLinks(request, urls, { botProtectedHosts: ['hacken.io'] });
    await testInfo.attach('link-report', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });

    const broken = results.filter((r) => !r.ok).map((r) => `${r.status ?? 'ERR'} ${r.url} ${r.note ?? ''}`);
    expect(broken, `broken links:\n${broken.join('\n')}`).toEqual([]);
  });
});
