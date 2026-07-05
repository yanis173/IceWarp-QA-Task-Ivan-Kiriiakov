import { expect } from "@playwright/test";
import { ContactFormData } from "../contact/types";
import { PotentialCustomerRecord } from "./types";

/**
 * Case-insensitive "one contains the other" check. Used for fields where
 * icewarp.com's backend is known to normalize the submitted value (e.g.
 * storing the country as "Czech" for a form submission of "Czech
 * Republic"), so an exact match would be too strict.
 */
function overlapsCaseInsensitive(a: string, b: string): boolean {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  return lowerA.includes(lowerB) || lowerB.includes(lowerA);
}

/**
 * Asserts that every field of a `PotentialCustomers` row matches the data
 * that was submitted through the contact form (blind-part step 2). Throws
 * (via Playwright's `expect`) on the first mismatch, so a failure points
 * directly at the field that didn't round-trip correctly.
 */
export function verifyCustomerRecordMatchesForm(
  record: PotentialCustomerRecord,
  formData: ContactFormData,
): void {
  expect(record.custEmail).toBe(formData.email);

  const fullName = `${formData.firstName} ${formData.lastName}`;
  expect(overlapsCaseInsensitive(record.custName, fullName)).toBe(true);

  expect(record.custNoUsers).toBe(formData.numberOfUsers);
  expect(record.custPhoneNo).toContain(formData.phoneNumber);
  expect(overlapsCaseInsensitive(record.custRole, formData.role.label)).toBe(true);
  expect(overlapsCaseInsensitive(record.custCountry, formData.country.displayName)).toBe(true);

  const submittedAtSeconds = Math.floor(formData.submittedAt.getTime() / 1000);
  const toleranceSeconds = 5 * 60;
  expect(record.custContactDate).toBeGreaterThanOrEqual(submittedAtSeconds - toleranceSeconds);
  expect(record.custContactDate).toBeLessThanOrEqual(submittedAtSeconds + toleranceSeconds);
}

/**
 * Returns the `cust_id` assigned to the customer by the database
 * (blind-part step 3).
 */
export function getCustomerId(record: PotentialCustomerRecord): number {
  return record.custId;
}
