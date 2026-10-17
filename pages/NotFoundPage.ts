import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** The 404 page. It has no route of its own, so `openInvalid` takes the bad path to load. */
export class NotFoundPage extends BasePage {
  protected path = '';
  readonly heading: Locator;
  readonly backHomeLink: Locator;
  readonly readyMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Page not found' });
    this.backHomeLink = page.getByRole('link', { name: 'Back to Homepage' });
    this.readyMarker = this.heading;
  }

  async openInvalid(path: string) {
    this.path = path;
    return this.open();
  }
}
