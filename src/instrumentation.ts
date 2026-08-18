export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertRequiredServerEnv } = await import("@/lib/env");
  const strict = process.env.VERCEL_ENV === "production";
  const result = assertRequiredServerEnv({ strict });
  if (!result.ok) {
    const message = `Missing required environment variables: ${result.missing.join(", ")}`;
    if (strict) {
      throw new Error(message);
    }
    console.warn(`[env] ${message}`);
  }
}
