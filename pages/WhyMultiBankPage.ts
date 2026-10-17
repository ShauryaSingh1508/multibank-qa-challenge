import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import content from '../data/why-multibank.json';

/** About Us > "Why MultiBank Group?" (linked from the "Company" nav item). */
export class WhyMultiBankPage extends BasePage {
  protected readonly path = content.path;
  readonly heading: Locator;
  readonly hero: Locator;
  readonly intro: Locator;
  readonly strengthSection: Locator;
  readonly readyMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1, name: content.heading });
    this.hero = page.locator('section').filter({ has: this.heading });
    this.intro = this.hero.getByRole('heading', { level: 2 });
    this.strengthSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: content.strength.heading }) });
    this.readyMarker = this.heading;
  }

  /** The stat value element; its label is the next sibling, so the pair is asserted together. */
  statValue(value: string): Locator {
    return this.hero.getByText(value, { exact: true });
  }

  statLabelFor(value: string): Locator {
    return this.statValue(value).locator('xpath=following-sibling::*[1]');
  }

  sectionHeading(text: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: text });
  }

  /** Body copy that sits directly under a section heading. */
  sectionBody(headingText: string): Locator {
    return this.sectionHeading(headingText).locator('xpath=following-sibling::p[1]');
  }

  strengthCard(title: string): Locator {
    return this.strengthSection
      .locator('div')
      .filter({ has: this.page.getByText(title, { exact: true }) })
      .last();
  }

  heading3(text: string): Locator {
    return this.page.getByRole('heading', { level: 3, name: text });
  }
}
