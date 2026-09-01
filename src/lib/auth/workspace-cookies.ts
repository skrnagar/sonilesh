export const ORG_COOKIE = "ehs360-org";
export const BUSINESS_UNIT_COOKIE = "ehs360-bu";
export const REGION_COOKIE = "ehs360-region";
export const SITE_COOKIE = "ehs360-site";
export const PROJECT_COOKIE = "ehs360-project";

export const WORKSPACE_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};
