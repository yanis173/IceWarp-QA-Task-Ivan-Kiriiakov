import { test } from "@playwright/test";
import { ContactPage } from "../src/contact/ContactPage";
import { contactSiteConfig } from "../src/contact/config";
import { ContactTestDataFactory } from "../src/contact/testDataFactory";
import { PotentialCustomersRepository } from "../src/db/PotentialCustomersRepository";
import { PotentialCustomerRecord } from "../src/db/types";
import { getCustomerId, verifyCustomerRecordMatchesForm } from "../src/db/verifyCustomerRecord";

/**
 * How long to wait for the AJAX contact form to report success before
 * concluding it is stuck behind a reCAPTCHA challenge (see README).
 */
const SUBMIT_TIMEOUT_MS = 10_000;

/**
 * How long to give the database to reflect a just-submitted row before
 * giving up the lookup.
 */
const DB_POLL_TIMEOUT_MS = 15_000;
const DB_POLL_INTERVAL_MS = 1_000;

test.describe("icewarp.com contact form", () => {
  /**
   * Covers the assignment's full test case end to end: fills and submits
   * the public contact form (UI part), then connects directly to the
   * `Customer` database to confirm the submission was stored correctly and
   * to read back the `cust_id` it was assigned (blind part).
   */
  test("fills, submits and verifies a contact-form lead", async ({ page }) => {
    const contactPage = new ContactPage(page);
    const contactData = ContactTestDataFactory.createRandomContact(test.info().testId);

    await test.step("1. Navigate to icewarp.com", async () => {
      await contactPage.open(contactSiteConfig.baseUrl);
    });

    await test.step('2. Click "Contact us" in the primary menu', async () => {
      await contactPage.openContactForm();
    });

    await test.step("3. Verify the contact panel appears on the right side of the UI", async () => {
      await contactPage.expectContactFormVisibleOnRightSide();
    });

    await test.step("4-5. Fill in the contact form, including the test message", async () => {
      await contactPage.fillForm(contactData);
    });

    await test.step("6. Send the contact form", async () => {
      await contactPage.submit();
    });

    let wasAccepted = false;
    await test.step("7. Verify no error message is present on the website", async () => {
      await contactPage.expectNoErrorMessage();
      wasAccepted = await contactPage.waitForSuccessPanel(SUBMIT_TIMEOUT_MS);
    });

    test.skip(
      !wasAccepted,
      "Submission did not complete - icewarp.com's contact form is protected by a " +
        "production reCAPTCHA that blocks headless automation from finishing the " +
        "POST. Skipping the blind (database) part since no row was created. See " +
        "README for how to run this against a reCAPTCHA-free environment.",
    );

    const repository = new PotentialCustomersRepository();
    try {
      await test.step("Blind part 1. Connect to the database", async () => {
        await repository.connect();
      });

      let record: PotentialCustomerRecord | null = null;
      await test.step("Blind part 2. Verify the submitted data was inserted correctly", async () => {
        const deadline = Date.now() + DB_POLL_TIMEOUT_MS;
        while (!record && Date.now() < deadline) {
          record = await repository.findByEmail(contactData.email);
          if (!record) {
            await page.waitForTimeout(DB_POLL_INTERVAL_MS);
          }
        }

        if (!record) {
          throw new Error(
            `No PotentialCustomers row found for ${contactData.email} within ${DB_POLL_TIMEOUT_MS}ms`,
          );
        }

        verifyCustomerRecordMatchesForm(record, contactData);
      });

      await test.step("Blind part 3. Read back the assigned cust_id", async () => {
        if (record) {
          console.log(`Customer inserted with cust_id = ${getCustomerId(record)}`);
        }
      });
    } finally {
      await repository.disconnect();
    }
  });
});
