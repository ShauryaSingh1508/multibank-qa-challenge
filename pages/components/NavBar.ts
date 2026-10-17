import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Site header: logo, main navigation, auth CTAs and the mobile menu sheet.
 * Shared by every page, so it is a component composed into BasePage rather than a page itself.
 */
export class NavBar {
  readonly root: Locator;
  readonly logo: Locator;
  readonly mainNav: Locator;
  readonly menuButton: Locator;
  readonly mobileMenu: Locator;
  readonly closeMenuButton: Locator;

  constructor(page: Page) {
    this.root = page.locator('header');
    this.logo = this.root.getByRole('link', { name: 'Home' });
    this.mainNav = this.root.getByRole('navigation', { name: 'Main' });
    this.menuButton = this.root.getByRole('button', { name: 'Open menu' });
    this.mobileMenu = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('button', { name: 'Close menu' }) });
    this.closeMenuButton = this.mobileMenu.getByRole('button', { name: 'Close menu' });
  }

  navLink(label: string): Locator {
    return this.mainNav.getByRole('link', { name: label, exact: true });
  }

  authLink(label: string): Locator {
    return this.root.getByRole('link', { name: label, exact: true });
  }

  mobileNavLink(label: string): Locator {
    return this.mobileMenu.getByRole('navigation').getByRole('link', { name: label, exact: true });
  }

  async navLabels(): Promise<string[]> {
    return (await this.mainNav.getByRole('link').allInnerTexts()).map((t) => t.trim());
  }

  async clickNavItem(label: string): Promise<void> {
    await this.navLink(label).click();
  }

  /**
   * A click that lands before React hydrates the button is silently dropped, so the click is
   * retried until the sheet actually opens (bounded by the toPass timeout).
   */
  async openMobileMenu(): Promise<void> {
    await expect(async () => {
      await this.menuButton.click();
      await expect(this.mobileMenu).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
  }

  async closeMobileMenu(): Promise<void> {
    await this.closeMenuButton.click();
    await this.mobileMenu.waitFor({ state: 'hidden' });
  }
}
