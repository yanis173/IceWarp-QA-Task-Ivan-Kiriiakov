import { Page, expect } from "@playwright/test";


/**
 * Page Object for the IceWarp WebClient two-step sign-in screen
 * (email/username first, then password on a second screen).
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  /** Navigates to the given IceWarp hostname's login page. */
  async open(hostname: string): Promise<void> {
    await this.page.goto(hostname, { waitUntil: "networkidle" });
  }

  /**
   * Runs the full sign-in flow: username -> Continue -> password -> Sign In.
   * Mirrors task steps 2-5 (fill username, click Continue, fill password, click Sign In).
   */
  async login(username: string, password: string): Promise<void> {
    await this.page.fill('[data-hook="email"]', username);
    await this.page.click('[data-hook="validate-email"]');

    const passwordField = this.page.locator('[data-hook="password"]');
    await expect(passwordField).toBeVisible();
    await passwordField.fill(password);
    await this.page.click('[data-hook="validate-password"]');
  }

  /**
   * Waits for the WebClient shell to finish its initial load after sign-in
   * (task step 6: "WebClient starts loading - wait for the loading process
   * to be finished"), then dismisses the first-run "what's new" wizard if
   * IceWarp decides to show it (only appears the very first time an account
   * signs in, so tests must not depend on it being there).
   */
  async waitForWebClientToLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: 60_000 });

    const skipWizard = this.page.getByText("Skip wizard");
    if (await skipWizard.isVisible().catch(() => false)) {
      await skipWizard.click();
    }
  }
}
