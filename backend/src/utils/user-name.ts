export interface UserNameParts {
  firstName: string;
  lastName?: string | null;
}

export function formatUserFullName(user: UserNameParts): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
}

export function splitFullName(fullName: string): { firstName: string; lastName: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
  return { firstName, lastName };
}
