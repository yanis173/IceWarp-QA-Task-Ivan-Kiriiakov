/** Reads an environment variable, falling back to `defaultValue` if unset. */
function readEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : defaultValue;
}

/** The public marketing site under test for the contact-form scenario. */
export const contactSiteConfig = {
  baseUrl: readEnv("CONTACT_SITE_URL", "https://icewarp.com"),
};
