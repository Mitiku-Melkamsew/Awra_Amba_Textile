import { describe, it, expect } from "vitest";
import {
  generateUsernameFromName,
  generatePasswordFromName,
} from "./user.service.js";

describe("User Credential Generation Based on Name", () => {
  it("generates a clean username from a two-part English name", () => {
    const username = generateUsernameFromName("Aster Aweke");
    expect(username).toBe("aster.aweke");
  });

  it("generates a clean username from a three-part English name", () => {
    const username = generateUsernameFromName("Abebe Bikila Derartu");
    expect(username).toBe("abebe.bikila.derartu");
  });

  it("generates a clean username from a single name", () => {
    const username = generateUsernameFromName("Haile");
    expect(username).toBe("haile");
  });

  it("handles extra spaces, punctuation, and mixed case", () => {
    const username = generateUsernameFromName("  Kenenisa   Bekele!  ");
    expect(username).toBe("kenenisa.bekele");
  });

  it("falls back to user.XXXX format for non-Latin / Amharic names", () => {
    const username = generateUsernameFromName("አበበ ከበደ");
    expect(username).toMatch(/^user\.\d{4}$/);
  });

  it("generates default password based on first name", () => {
    const password = generatePasswordFromName("Aster Aweke");
    expect(password).toBe("Aster@123");
  });

  it("generates capitalized default password from lowercase name", () => {
    const password = generatePasswordFromName("abebe bikila");
    expect(password).toBe("Abebe@123");
  });

  it("generates fallback password for non-Latin / Amharic names", () => {
    const password = generatePasswordFromName("አበበ ከበደ");
    expect(password).toMatch(/^Awra@\d{4}$/);
  });
});
