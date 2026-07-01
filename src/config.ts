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

/** Credentials and target instance for the IceWarp WebClient under test. */
export const config = {
  hostname: requireEnv("ICEWARP_HOSTNAME"),
  username: requireEnv("ICEWARP_USERNAME"),
  password: requireEnv("ICEWARP_PASSWORD"),
};
