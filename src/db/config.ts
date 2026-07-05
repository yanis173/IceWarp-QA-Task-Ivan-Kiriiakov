/** Reads a required environment variable or throws with a helpful message. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

/** Reads an environment variable, falling back to `defaultValue` if unset. */
function readEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : defaultValue;
}

/**
 * Connection details for the `Customer` database that backs the
 * icewarp.com contact form, as described by the assignment's schema
 * (database `Customer`, table `PotentialCustomers`).
 */
export const dbConfig = {
  host: requireEnv("DB_HOST"),
  port: Number(readEnv("DB_PORT", "3306")),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  database: readEnv("DB_NAME", "Customer"),
  table: readEnv("DB_TABLE", "PotentialCustomers"),
};
