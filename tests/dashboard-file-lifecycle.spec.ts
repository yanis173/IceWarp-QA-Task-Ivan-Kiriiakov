import { test } from "@playwright/test";
import { config } from "../src/config";
import { DashboardPage } from "../src/pages/DashboardPage";
import { LoginPage } from "../src/pages/LoginPage";
import { NewFileType } from "../src/types";

/**
 * The assignment requires exercising at least two of the three "New file"
 * options from the Dashboard's right-click menu (Documents, Spreadsheet,
 * Presentation). All three are covered here.
 */
const FILE_TYPES: NewFileType[] = ["document", "spreadsheet", "presentation"];

for (const fileType of FILE_TYPES) {
  test.describe(`Dashboard file lifecycle - ${fileType}`, () => {
    let dashboard: DashboardPage;

    /**
     * Signs in and lands on a clean Dashboard before every test. Also
     * force-closes any windows left open on the account by a previous run,
     * since IceWarp restores open windows on login (see
     * DashboardPage.closeAllOpenWindows for details).
     */
    test.beforeEach(async ({ page }) => {
      const login = new LoginPage(page);
      await login.open(config.hostname);
      await login.login(config.username, config.password);
      await login.waitForWebClientToLoad();

      dashboard = new DashboardPage(page);
      await dashboard.closeAllOpenWindows();
      await dashboard.ensureDashboardIsActive();
    });

    /** Leaves the account clean for the next test run. */
    test.afterEach(async () => {
      await dashboard.closeAllOpenWindows();
    });

    /**
     * Covers the full assignment flow for one file type: create it from
     * the Dashboard, wait out the editor load, close the editor, confirm
     * the file shows up on the board, delete it, then confirm it's gone.
     */
    test(`creates, verifies and deletes a ${fileType}`, async () => {
      const fileName = `QA-Auto-${fileType}-${Date.now()}`;

      await dashboard.createFile(fileType, fileName);
      await dashboard.closeEditor();
      await dashboard.expectFileToBeVisible(fileName);

      await dashboard.deleteFile(fileName);
      await dashboard.expectFileToBeAbsent(fileName);
    });
  });
}
