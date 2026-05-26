import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { normalizeIdFilter } from "../src/api/normalizeIdFilter";

const VALID_ID = "507f1f77bcf86cd799439011";

describe("normalizeIdFilter", () => {
  it("converts string _id to ObjectId when valid", () => {
    const filter = { _id: VALID_ID, name: "test" };
    const result = normalizeIdFilter(filter);

    expect(result._id).toBeInstanceOf(ObjectId);
    expect((result._id as ObjectId).toHexString()).toBe(VALID_ID);
    expect(result.name).toBe("test");
  });

  it("leaves filter unchanged when _id is absent", () => {
    const filter = { name: "only-name" };
    const result = normalizeIdFilter(filter);

    expect(result).toEqual({ name: "only-name" });
    expect(result).toBe(filter);
  });

  it("leaves invalid _id strings unchanged", () => {
    const filter = { _id: "not-an-objectid" };
    const result = normalizeIdFilter(filter);

    expect(result._id).toBe("not-an-objectid");
  });

  it("preserves existing ObjectId _id", () => {
    const oid = new ObjectId(VALID_ID);
    const filter = { _id: oid };
    const result = normalizeIdFilter(filter);

    expect(result._id).toBe(oid);
  });
});
