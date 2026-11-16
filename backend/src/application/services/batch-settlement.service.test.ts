import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/prisma.js", () => ({ prisma: {} }));

import { eligibleReturnedZigIds, discoverOutOfCutoffZigs } from "./batch-settlement.service.js";

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

  it("includes an out-of-cutoff zig when passed in includeZigIds as an exception", () => {
    const ids = eligibleReturnedZigIds(
      [{ zigId: "zig-before" }, { zigId: "zig-after" }],
      [
        { zigId: "zig-before", dateReturned: "2026-10-12T10:00:00.000Z" },
        { zigId: "zig-after", dateReturned: "2026-10-14T10:00:00.000Z" },
      ],
      new Date("2026-10-13T00:00:00.000Z"),
      ["zig-after"],
    );

    expect([...ids].sort()).toEqual(["zig-after", "zig-before"]);
  });
});

describe("discoverOutOfCutoffZigs", () => {
  it("identifies returned orders falling after cutoff that are not yet exceptions", () => {
    const outOfCutoff = discoverOutOfCutoffZigs(
      [
        { zigId: "zig-before", weaver: { userId: 1, fullName: "Abebe" } },
        { zigId: "zig-after", weaver: { userId: 2, fullName: "Almaz" } },
      ],
      [
        { zigId: "zig-before", dateReturned: "2026-10-12T10:00:00.000Z" },
        { zigId: "zig-after", dateReturned: "2026-10-14T10:00:00.000Z" },
      ],
      new Date("2026-10-13T00:00:00.000Z"),
      [],
    );

    expect(outOfCutoff.length).toBe(1);
    expect(outOfCutoff[0].zigId).toBe("zig-after");
    expect(outOfCutoff[0].weaverName).toBe("Almaz");
  });
});