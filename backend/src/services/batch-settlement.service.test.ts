import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/prisma.js", () => ({ prisma: {} }));

import { eligibleReturnedZigIds } from "./batch-settlement.service.js";

describe("eligibleReturnedZigIds", () => {
  it("excludes already-settled zigs with no unsettled returns", () => {
    const ids = eligibleReturnedZigIds(
      [{ zigId: "zig-old" }, { zigId: "zig-new" }],
      [{ zigId: "zig-new", dateReturned: "2026-10-12T10:00:00.000Z" }],
    );

    expect([...ids]).toEqual(["zig-new"]);
  });

  it("applies the cutoff to the first currently unsettled return", () => {
    const ids = eligibleReturnedZigIds(
      [{ zigId: "zig-before" }, { zigId: "zig-after" }],
      [
        { zigId: "zig-before", dateReturned: "2026-10-12T10:00:00.000Z" },
        { zigId: "zig-after", dateReturned: "2026-10-14T10:00:00.000Z" },
      ],
      new Date("2026-10-13T00:00:00.000Z"),
    );

    expect([...ids]).toEqual(["zig-before"]);
  });
});