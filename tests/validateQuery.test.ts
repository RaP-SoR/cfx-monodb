import { describe, expect, it } from "vitest";
import {
  MAX_DEPTH,
  MAX_KEYS,
  validateDocument,
  validateFilter,
  validateUpdate,
} from "../src/validateQuery";

describe("validateFilter", () => {
  it("accepts simple equality filter", () => {
    expect(() => validateFilter({ name: "alpha", active: true })).not.toThrow();
  });

  it("accepts valid $and with field equality", () => {
    expect(() =>
      validateFilter({ $and: [{ name: "x" }, { active: true }] }),
    ).not.toThrow();
  });

  it("accepts nested comparison operators", () => {
    expect(() =>
      validateFilter({ level: { $gte: 10, $lt: 100 } }),
    ).not.toThrow();
  });

  it("blocks top-level $where (regression)", () => {
    expect(() =>
      validateFilter({ $where: "this.a > 0" }),
    ).toThrow(/\$where/);
  });

  it("blocks $where nested inside $or", () => {
    expect(() =>
      validateFilter({ $or: [{ $where: "this.x === 1" }] }),
    ).toThrow(/\$where/);
  });

  it("blocks $function nested inside $and", () => {
    expect(() =>
      validateFilter({
        $and: [
          {
            $function: {
              body: "function() { return true; }",
              args: [],
              lang: "js",
            },
          },
        ],
      }),
    ).toThrow(/\$function/);
  });

  it("blocks $expr at any nesting depth", () => {
    expect(() =>
      validateFilter({ $or: [{ $expr: { $gt: ["$a", 5] } }] }),
    ).toThrow(/\$expr/);
  });

  it("blocks $jsonSchema", () => {
    expect(() =>
      validateFilter({ $jsonSchema: { bsonType: "object" } }),
    ).toThrow(/\$jsonSchema/);
  });

  it("blocks $accumulator deeply nested", () => {
    expect(() =>
      validateFilter({
        $and: [
          { foo: 1 },
          { $or: [{ bar: { $accumulator: { init: "fn" } } }] },
        ],
      }),
    ).toThrow(/\$accumulator/);
  });

  it("rejects non-object filter", () => {
    expect(() => validateFilter(null)).toThrow(/filter shape/);
    expect(() => validateFilter("string")).toThrow(/filter shape/);
    expect(() => validateFilter([])).toThrow(/filter shape/);
  });

  it("throws when nested depth exceeds MAX_DEPTH", () => {
    let nested: Record<string, unknown> = { leaf: 1 };
    for (let i = 0; i < MAX_DEPTH + 2; i += 1) {
      nested = { wrap: nested };
    }
    expect(() => validateFilter(nested)).toThrow(/depth exceeded/);
  });

  it("accepts payload at the depth limit boundary", () => {
    let nested: Record<string, unknown> = { leaf: 1 };
    for (let i = 0; i < MAX_DEPTH - 2; i += 1) {
      nested = { wrap: nested };
    }
    expect(() => validateFilter(nested)).not.toThrow();
  });

  it("throws when payload has too many keys", () => {
    const huge: Record<string, unknown> = {};
    for (let i = 0; i < MAX_KEYS + 5; i += 1) {
      huge[`k${i}`] = i;
    }
    expect(() => validateFilter(huge)).toThrow(/too large/);
  });
});

describe("validateUpdate", () => {
  it("accepts $set update", () => {
    expect(() => validateUpdate({ $set: { a: 1 } })).not.toThrow();
  });

  it("accepts multi-modifier update", () => {
    expect(() =>
      validateUpdate({ $set: { name: "x" }, $inc: { count: 1 } }),
    ).not.toThrow();
  });

  it("rejects empty update", () => {
    expect(() => validateUpdate({})).toThrow(/Empty update/);
  });

  it("rejects non-object update", () => {
    expect(() => validateUpdate(null)).toThrow(/update shape/);
    expect(() => validateUpdate([{ $set: { a: 1 } }])).toThrow(/update shape/);
  });

  it("blocks $where inside update modifier", () => {
    expect(() =>
      validateUpdate({ $set: { $where: "this.a > 0" } }),
    ).toThrow(/\$where/);
  });

  it("blocks $function inside update modifier", () => {
    expect(() =>
      validateUpdate({ $set: { $function: { body: "fn" } } }),
    ).toThrow(/\$function/);
  });
});

describe("validateDocument", () => {
  it("accepts plain document", () => {
    expect(() =>
      validateDocument({ name: "x", age: 30, tags: ["a", "b"] }),
    ).not.toThrow();
  });

  it("blocks $where in inserted document", () => {
    expect(() => validateDocument({ $where: "evil" })).toThrow(/\$where/);
  });

  it("blocks $function nested in array", () => {
    expect(() =>
      validateDocument({
        items: [{ name: "ok" }, { $function: { body: "fn" } }],
      }),
    ).toThrow(/\$function/);
  });
});
