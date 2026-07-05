/**
 * A single country entry used to drive the contact form's "Country" and
 * "Phone" (country-code prefix) `<select>` elements. `isoCode` is the value
 * icewarp.com uses for both selects; `dialPrefix` is only used for the log
 * lines emitted while filling the form.
 */
export interface CountryOption {
  isoCode: string;
  displayName: string;
  dialPrefix: string;
}

/**
 * The eight roles offered by the contact form's "Role" dropdown, keyed by
 * the `<option value="...">` icewarp.com submits versus the label shown to
 * the user (and, per the sample database row, the value that ends up
 * stored in `PotentialCustomers.cust_role`).
 */
export interface RoleOption {
  value: string;
  label: string;
}

/**
 * All data needed to fill out and submit the icewarp.com contact form.
 * Deliberately mixes data types (string, number, Date) so the same object
 * can drive both the UI form-fill and the later database assertions.
 */
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  message: string;
  phoneNumber: string;
  numberOfUsers: number;
  country: CountryOption;
  role: RoleOption;
  /** Wall-clock time the test started filling the form, used only for reporting. */
  submittedAt: Date;
}
