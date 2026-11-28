import { describe, it, expect } from "vitest";
import { numericParam } from "./params.js";

function requestWith(id: unknown) {
  return { params: { id } } as any;
}

describe("numericParam", () => {
  it("returns an already-coerced numeric parameter", () => {
    expect(numericParam(requestWith(5))).toBe(5);
  });

  it("falls back to parsing when validation did not coerce the value", () => {
    expect(numericParam(requestWith("7"))).toBe(7);
  });

  it("rejects non-numeric values instead of passing a string to the service", () => {
    expect(() => numericParam(requestWith("abc"))).toThrow(/Invalid numeric route parameter/);
  });

  it("rejects zero and negative ids", () => {
    expect(() => numericParam(requestWith(0))).toThrow();
    expect(() => numericParam(requestWith(-3))).toThrow();
  });
});
