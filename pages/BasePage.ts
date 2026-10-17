import type { Locator, Page, Response } from '@playwright/test';
import { localePath } from '../config/env';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';

/**
 * Behaviour shared by every page object: navigation, the shared header/footer
 * components and layout helpers. Page objects expose locators and intent-level actions;
 * assertions stay in the specs so a failure points at the requirement, not at a helper.
 */
export abstract class BasePage {
  readonly header: NavBar;
  readonly footer: Footer;

  /** Path relative to the locale root, e.g. `/explore`. */
  protected abstract readonly path: string;

  /** An element that only exists once the page's main content has rendered. */
  abstract readonly readyMarker: Locator;

  constructor(readonly page: Page) {
    this.header = new NavBar(page);
    this.footer = new Footer(page);
  }

  get url(): string {
    return localePath(this.path);
  }

  /**
   * Navigates and waits for the `load` event (scripts executed, so the page is hydrated and
   * interactive) plus the page's own content. Not `networkidle`: live price feeds never go idle.
   */
  async open(): Promise<Response | null> {
    const response = await this.page.goto(this.url, { waitUntil: 'load' });
    await this.waitUntilReady();
    return response;
  }

  async waitUntilReady(): Promise<void> {
    await this.readyMarker.waitFor({ state: 'visible' });
  }

  /** True when the document is wider than the viewport, i.e. the user can scroll sideways. */
  async hasHorizontalOverflow(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  }

  /** Images inside `scope` that failed to load (naturalWidth 0 after `complete`). */
  async brokenImages(scope: Locator): Promise<string[]> {
    return scope
      .locator('img')
      .evaluateAll((imgs) =>
        (imgs as HTMLImageElement[])
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.currentSrc || img.src),
      );
  }
}
