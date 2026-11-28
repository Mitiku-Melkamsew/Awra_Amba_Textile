import { describe, it, expect } from "vitest";
import { UserRole } from "@prisma/client";
import { serializeAuthUser } from "./auth.serializer.js";

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    userId: 7,
    username: "demo",
    firstName: "Demo",
    lastName: "Weaver",
    phone: "0911000000",
    email: "demo@example.com",
    isActive: true,
    roles: [{ role: UserRole.weaver }],
    ...overrides,
  };
}

describe("serializeAuthUser", () => {
  it("builds the public payload with fullName and roles", () => {
    const result = serializeAuthUser(makeUser() as any);

    expect(result).toEqual({
      userId: 7,
      username: "demo",
      firstName: "Demo",
      lastName: "Weaver",
      fullName: "Demo Weaver",
      phone: "0911000000",
      email: "demo@example.com",
      roles: [UserRole.weaver],
      isActive: true,
    });
  });

  it("picks fields explicitly and never leaks credentials", () => {
    const result = serializeAuthUser(
      makeUser({ passwordHash: "argon2-hash", tokenVersion: 4 }) as any,
    );

    expect("passwordHash" in result).toBe(false);
    expect("tokenVersion" in result).toBe(false);
  });

  it("normalises a missing email to null", () => {
    const result = serializeAuthUser(makeUser({ email: undefined }) as any);
    expect(result.email).toBeNull();
  });
});
