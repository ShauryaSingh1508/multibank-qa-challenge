import type { Locator, Page } from '@playwright/test';

export class Footer {
  readonly root: Locator;
  readonly links: Locator;

  constructor(page: Page) {
    this.root = page.locator('footer');
    this.links = this.root.getByRole('link');
  }

  columnHeading(name: string): Locator {
    return this.root.getByRole('heading', { name, exact: true });
  }
}
