export type AnyRecord = Record<string, any>;

/**
 * Copies only explicitly allowlisted keys when present on the source object.
 * Keeps list vs detail shapes intact while blocking accidental DB column leaks.
 */
export function project(source: AnyRecord, keys: readonly string[]): AnyRecord {
  const out: AnyRecord = {};
  for (const key of keys) {
    if (key in source) out[key] = source[key];
  }
  return out;
}

const USER_BRIEF_KEYS = [
  "userId",
  "username",
  "firstName",
  "lastName",
  "fullName",
  "phone",
  "isActive",
] as const;

export interface UserBriefResponse {
  userId: number;
  username?: string;
  firstName: string;
  lastName: string | null;
  fullName?: string;
  phone?: string | null;
  isActive?: boolean;
}

export function serializeUserBrief(user: AnyRecord): UserBriefResponse {
  const out = project(user, USER_BRIEF_KEYS) as UserBriefResponse;
  if (out.fullName === undefined && (user.firstName !== undefined || user.lastName !== undefined)) {
    out.fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  }
  return out;
}
