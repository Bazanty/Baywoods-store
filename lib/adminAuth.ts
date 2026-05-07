import { cookies } from "next/headers";

/**
 * Guard for all admin server actions.
 * Middleware only protects /admin/* page requests — server actions can be
 * invoked from any page, so each mutation must verify the cookie itself.
 */
export function requireAdmin() {
  const session = cookies().get("admin_session")?.value;
  const secret = process.env.ADMIN_SECRET_TOKEN;
  if (!secret || !session || session !== secret) {
    throw new Error("Unauthorized");
  }
}
