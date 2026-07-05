import { Locator, Page, expect } from "@playwright/test";
import { ContactFormData } from "./types";

/**
 * Page Object for the icewarp.com "Contact us" flow. On icewarp.com the
 * contact form is not a separate page: every page carries a hidden panel
 * (`#sitewide-contact-window`) that slides in from the right-hand edge of
 * the viewport when the "Contact sales" call-to-action - the current
 * implementation of the assignment's left-menu "Contact us" link - is
 * clicked. This class drives that whole flow: opening the panel, filling
 * the embedded form, submitting it, and reading back any validation
 * errors it shows.
 */
export class ContactPage {
  /** The right-hand sliding panel that contains the contact form (task step 3). */
  private readonly panel: Locator;
  /** The primary-menu control that opens the panel (task step 2). */
  private readonly openContactTrigger: Locator;
  /** The `<form>` itself, once the panel is open. */
  private readonly form: Locator;
  /** Wrapper shown in place of the form after a successful submission. */
  private readonly successPanel: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.locator("#sitewide-contact-window");
    this.openContactTrigger = page.locator("#contact-sales-button");
    this.form = page.locator("#frm-homepageContactForm");
    this.successPanel = page.locator("#homepage-contact-form-success");
  }

  /** Navigates to the icewarp.com homepage (task step 1). */
  async open(baseUrl: string): Promise<void> {
    await this.page.goto(baseUrl);
  }

  /**
   * Clicks the "Contact us" control in the primary menu and waits for the
   * panel to finish sliding into view (task step 2).
   */
  async openContactForm(): Promise<void> {
    await this.openContactTrigger.click();
    await expect(this.panel).toHaveClass(/active/);
  }

  /**
   * Asserts that the contact panel has visibly appeared on the right-hand
   * side of the page (task step 3), by checking both that it carries the
   * "active" (slid-in) state and that its bounding box sits in the right
   * half of the viewport.
   */
  async expectContactFormVisibleOnRightSide(): Promise<void> {
    await expect(this.panel).toBeVisible();
    await expect(this.form).toBeVisible();

    const viewport = this.page.viewportSize();
    const box = await this.panel.boundingBox();
    if (viewport && box) {
      expect(box.x + box.width / 2).toBeGreaterThan(viewport.width / 2);
    }
  }

  /**
   * Fills every field the contact form requires (task step 4) plus the
   * fixed test message (task step 5). Selects are set by their option
   * value; the phone field only receives the local number, since the
   * country code is supplied by the adjacent `country_prefix` select.
   */
  async fillForm(data: ContactFormData): Promise<void> {
    await this.form.locator('[name="firstName"]').fill(data.firstName);
    await this.form.locator('[name="lastName"]').fill(data.lastName);
    await this.form.locator('[name="email"]').fill(data.email);
    await this.form.locator('[name="country"]').selectOption(data.country.isoCode);
    await this.form.locator('[name="country_prefix"]').selectOption(data.country.isoCode);
    await this.form.locator('[name="phone"]').fill(data.phoneNumber);
    await this.form.locator('[name="company"]').fill(data.company);
    await this.form.locator('[name="role"]').selectOption(data.role.value);
    await this.form.locator('[name="users"]').fill(data.numberOfUsers.toString());
    await this.form.locator('[name="message"]').fill(data.message);
  }

  /** Clicks the form's Submit button (task step 6). */
  async submit(): Promise<void> {
    await this.form.locator("#homepage-form-submit-btn").click();
  }

  /**
   * Asserts that none of the form's inline validation-error labels are
   * showing (task step 7). icewarp.com renders one `<span
   * class="form-error-red">` per field and only fills it in with text when
   * that field fails validation, so an empty/hidden span for every field
   * means the submission was accepted without error.
   */
  async expectNoErrorMessage(): Promise<void> {
    const errorSpans = this.form.locator(".form-error-red");
    const count = await errorSpans.count();

    for (let i = 0; i < count; i++) {
      await expect(errorSpans.nth(i)).toBeEmpty();
    }
  }

  /**
   * Waits (briefly) for the success panel to replace the form. Returns
   * `false` instead of throwing when it doesn't appear in time, since a
   * production reCAPTCHA challenge can legitimately keep the form from
   * completing under automation - see README for details.
   */
  async waitForSuccessPanel(timeoutMs: number): Promise<boolean> {
    try {
      await expect(this.successPanel).toBeVisible({ timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }
}
