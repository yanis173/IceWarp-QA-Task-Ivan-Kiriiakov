import { ContactFormData, CountryOption, RoleOption } from "./types";

/**
 * The full set of roles offered by the contact form's "Role" dropdown
 * (`<select name="role">` on icewarp.com), in the same order as the site.
 */
const ROLE_OPTIONS: readonly RoleOption[] = [
  { value: "it_manager", label: "IT Manager" },
  { value: "owner", label: "Owner" },
  { value: "ceo", label: "CEO" },
  { value: "cfo", label: "CFO" },
  { value: "procurement", label: "Procurement" },
  { value: "admin", label: "Admin" },
  { value: "reseller", label: "Reseller" },
  { value: "other", label: "Somebody else (Other)" },
];

/**
 * A handful of countries from the contact form's "Country" dropdown, each
 * paired with the dial prefix its ISO code selects in the adjacent phone
 * country-code dropdown.
 */
const COUNTRY_OPTIONS: readonly CountryOption[] = [
  { isoCode: "CZ", displayName: "Czech Republic", dialPrefix: "+420" },
  { isoCode: "DE", displayName: "Germany", dialPrefix: "+49" },
  { isoCode: "GB", displayName: "United Kingdom", dialPrefix: "+44" },
  { isoCode: "US", displayName: "United States", dialPrefix: "+1" },
];

/** Picks a uniformly random element from a non-empty array. */
function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Generates a random integer in the inclusive range [min, max]. */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Builds fresh, randomized data for one contact-form submission. Each call
 * produces a unique email address so the resulting `PotentialCustomers` row
 * can always be found unambiguously by e-mail, even across repeated test
 * runs against the same database.
 */
export class ContactTestDataFactory {
  /**
   * Returns a complete `ContactFormData` object ready to be handed to
   * `ContactPage.fillForm()`. `runId` should be unique per test run (a
   * timestamp is used by default) and is embedded in the e-mail and message
   * so submissions from different runs never collide in the database.
   */
  static createRandomContact(runId: string = Date.now().toString()): ContactFormData {
    const country = pickRandom(COUNTRY_OPTIONS);
    const role = pickRandom(ROLE_OPTIONS);

    return {
      firstName: "QA",
      lastName: `Automation-${runId}`,
      email: `qa.automation+${runId}@example.com`,
      company: `Playwright Test Co ${runId}`,
      message: "Ignore this - this is just the test",
      phoneNumber: randomInt(100_000_000, 999_999_999).toString(),
      numberOfUsers: randomInt(1, 500),
      country,
      role,
      submittedAt: new Date(),
    };
  }
}
