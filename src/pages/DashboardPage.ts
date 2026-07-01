import { Locator, Page, expect } from "@playwright/test";
import { NewFileType } from "../types";

/**
 * Page Object for the IceWarp WebClient Dashboard: the left-side app
 * launcher, the board's right-click "New file" menu, the file-creation
 * dialog, the WebDocuments (ONLYOFFICE) editor window, and the file
 * widgets that appear on the board once a file has been created.
 */
export class DashboardPage {
  /** Root of the widget board (task step 8's "board"). */
  private readonly board: Locator;

  constructor(private readonly page: Page) {
    this.board = page.locator('[data-iw-test="desktop.grid"]');
  }

  /**
   * Makes sure the Dashboard is the active view (task step 7). The
   * Dashboard icon is the first (topmost) icon in the left app rail, so
   * if the board isn't already showing, this clicks that icon.
   */
  async ensureDashboardIsActive(): Promise<void> {
    const alreadyActive = await this.board.isVisible().catch(() => false);
    if (alreadyActive) return;

    await this.page.locator("a.dashboard").click();
    await this.board.waitFor({ state: "visible" });
  }

  /**
   * Right-clicks an empty spot on the board and opens the "New" submenu
   * (task steps 8-9). Immediately after navigating to the Dashboard, the
   * board's drag-and-drop grid can take a moment to attach its event
   * listeners even though the element is already visible in the DOM, so a
   * single right-click can silently do nothing. This retries the
   * right-click until the submenu trigger actually shows up.
   */
  private async openNewFileMenu(): Promise<void> {
    const newMenuItem = this.page.locator('li[data-key="new"]');

    await expect(async () => {
      await this.board.click({
        button: "right",
        position: { x: 600, y: 250 },
      });
      await expect(newMenuItem).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    await newMenuItem.hover();
  }

  /**
   * Creates a new file of the given type with the given name (task steps
   * 9-10) and waits for the WebDocuments editor to finish loading (task
   * step 11). `fileName` should not include an extension - IceWarp adds
   * the correct one (.docx/.xlsx/.pptx) for the chosen type.
   */
  async createFile(type: NewFileType, fileName: string): Promise<void> {
    await this.openNewFileMenu();
    await this.page.locator(`li[data-key="${type}"]`).click();

    // This legacy dialog only enables its "Create" button in response to
    // real key events, so a programmatic .fill() (which just sets the
    // value) leaves the button permanently disabled - it has to be typed.
    const nameInput = this.page.locator('[id="gui.gw#name"]');
    await nameInput.click();
    await this.page.keyboard.type(fileName, { delay: 30 });

    // The button's label always reads "Create Document" no matter which
    // file type was picked (a quirk of the app, not a bug in this code),
    // so it must be targeted by its stable internal id rather than text.
    const createButton = this.page.locator('[id="gui.gw.x_btn_ok#main"]');
    await expect(createButton).toBeEnabled();
    await createButton.click();

    await this.waitForEditorToLoad();
  }

  /** Waits for the WebDocuments (ONLYOFFICE) editor window to be ready. */
  async waitForEditorToLoad(): Promise<void> {
    await this.page
      .locator('[id="gui.doc#rem"]')
      .waitFor({ state: "visible", timeout: 30_000 });
  }

  /** Closes the WebDocuments editor window (task step 12). */
  async closeEditor(): Promise<void> {
    await this.page.locator('[id="gui.doc#rem"]').click();
  }

  /**
   * Locates a file widget on the board by its base name (without
   * extension), matching regardless of which file type produced it.
   */
  private getFileWidget(fileName: string): Locator {
    return this.page.locator(`[data-name^="${fileName}"]`);
  }

  /** Asserts that the given file is present on the Dashboard board. */
  async expectFileToBeVisible(fileName: string): Promise<void> {
    await expect(this.getFileWidget(fileName)).toBeVisible();
  }

  /** Asserts that the given file is no longer present on the board. */
  async expectFileToBeAbsent(fileName: string): Promise<void> {
    await expect(this.getFileWidget(fileName)).toHaveCount(0);
  }

  /**
   * Deletes a file from the board via its context menu (task steps
   * 14-17): right-click the file, choose Delete, then confirm in the
   * dialog that appears.
   */
  async deleteFile(fileName: string): Promise<void> {
    await this.getFileWidget(fileName).click({ button: "right" });
    await this.page.locator('li[data-key="DELETE"]').click();

    const confirmDialog = this.page.locator("dialog");
    await confirmDialog.getByRole("button", { name: "Delete" }).click();
  }

  /**
   * Force-closes every open desktop window/dialog. IceWarp WebClient
   * persists open windows server-side against the account rather than in
   * browser storage, so a window left open by a previous (e.g. crashed)
   * test run reappears the next time that account signs in. Call this
   * before/after a test to keep the account's desktop state clean.
   */
  async closeAllOpenWindows(): Promise<void> {
    for (let attempt = 0; attempt < 15; attempt++) {
      const activeConfirmButton = this.page
        .locator(".frm_confirm.active .obj_button")
        .first();
      if (await activeConfirmButton.isVisible().catch(() => false)) {
        await activeConfirmButton.click();
        await this.page.waitForTimeout(300);
        continue;
      }

      const closeButtons = this.page.locator('[id$="#rem"]');
      const count = await closeButtons.count();
      if (count === 0) break;

      await closeButtons.last().click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(300);
    }
  }
}
