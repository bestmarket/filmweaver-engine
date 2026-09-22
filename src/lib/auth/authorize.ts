/**
 * Authorization primitives — pure, testable, and used by every server function
 * that touches a user-owned resource.
 */

export type AppRole = "USER" | "ADMIN";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  roles: AppRole[];
  status: "ACTIVE" | "SUSPENDED";
};

export class AuthError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

export const unauthorized = (message = "You need to sign in.") =>
  new AuthError("UNAUTHENTICATED", message, 401);

export const forbidden = (message = "You do not have access to this resource.") =>
  new AuthError("FORBIDDEN", message, 403);

export const notFound = (message = "Not found.") => new AuthError("NOT_FOUND", message, 404);

export function hasRole(user: Pick<AuthenticatedUser, "roles">, role: AppRole): boolean {
  return user.roles.includes(role);
}

export function isAdmin(user: Pick<AuthenticatedUser, "roles">): boolean {
  return hasRole(user, "ADMIN");
}

export function requireUser(user: AuthenticatedUser | null): AuthenticatedUser {
  if (!user) throw unauthorized();
  if (user.status !== "ACTIVE") throw forbidden("This account is suspended.");
  return user;
}

export function requireAdmin(user: AuthenticatedUser | null): AuthenticatedUser {
  const active = requireUser(user);
  if (!isAdmin(active)) throw forbidden("Administrator access required.");
  return active;
}

/**
 * Ownership gate for every user-owned row. Admins are NOT granted implicit
 * access to user content — they use explicit admin endpoints instead, so a
 * compromised admin session cannot silently read customer projects.
 */
export function assertOwnership<T extends { user_id: string }>(
  resource: T | null | undefined,
  user: Pick<AuthenticatedUser, "id">,
): T {
  if (!resource) throw notFound();
  if (resource.user_id !== user.id) throw forbidden();
  return resource;
}
