import { describe, expect, it } from "vitest";
import { formatError, redactMongoUri } from "../src/utils";

describe("redactMongoUri", () => {
  const user = "dbuser";
  const pass = "s3cretP@ss!";
  const host = "cluster0.example.mongodb.net";
  const dbPath = "/mydb?retryWrites=true";

  it("redacts user and password in mongodb:// URIs", () => {
    const uri = `mongodb://${user}:${pass}@localhost:27017${dbPath}`;
    const redacted = redactMongoUri(uri);

    expect(redacted).toBe(`mongodb://***:***@localhost:27017${dbPath}`);
    expect(redacted).not.toContain(user);
    expect(redacted).not.toContain(pass);
  });

  it("redacts user and password in mongodb+srv:// URIs", () => {
    const uri = `mongodb+srv://${user}:${pass}@${host}${dbPath}`;
    const redacted = redactMongoUri(uri);

    expect(redacted).toBe(`mongodb+srv://***:***@${host}${dbPath}`);
    expect(redacted).not.toContain(user);
    expect(redacted).not.toContain(pass);
  });

  it("leaves URIs without credentials unchanged", () => {
    const uri = `mongodb://localhost:27017${dbPath}`;
    expect(redactMongoUri(uri)).toBe(uri);
  });

  it("redacts username-only credentials", () => {
    const uri = `mongodb://${user}@${host}${dbPath}`;
    const redacted = redactMongoUri(uri);

    expect(redacted).toBe(`mongodb://***:***@${host}${dbPath}`);
    expect(redacted).not.toContain(user);
  });

  it("redacts URL-encoded credentials", () => {
    const encodedPass = encodeURIComponent("p@ss:w/ord");
    const uri = `mongodb+srv://${user}:${encodedPass}@${host}/`;
    const redacted = redactMongoUri(uri);

    expect(redacted).toBe(`mongodb+srv://***:***@${host}/`);
    expect(redacted).not.toContain(user);
    expect(redacted).not.toContain(encodedPass);
    expect(redacted).not.toContain("p@ss");
  });

  it("redacts passwords that contain @ characters", () => {
    const uri = `mongodb://${user}:${pass}@localhost:27017${dbPath}`;
    const redacted = redactMongoUri(uri);

    expect(redacted).toBe(`mongodb://***:***@localhost:27017${dbPath}`);
    expect(redacted).not.toContain(user);
    expect(redacted).not.toContain(pass);
  });

  it("never leaks credentials from realistic fixtures", () => {
    const fixtures = [
      {
        uri: "mongodb://dbadmin:SuperSecret123@127.0.0.1:27017/game?authSource=admin",
        secrets: ["dbadmin", "SuperSecret123"],
      },
      {
        uri: "mongodb+srv://prod_user:Pr0d_Pass!@cluster0.abc123.mongodb.net/production?tls=true",
        secrets: ["prod_user", "Pr0d_Pass!"],
      },
      {
        uri: "mongodb://readonly:read%40only@mongo.internal:27017",
        secrets: ["readonly", "read%40only", "read@only"],
      },
    ];

    for (const { uri, secrets } of fixtures) {
      const redacted = redactMongoUri(uri);

      expect(redacted).toContain("***:***@");
      for (const secret of secrets) {
        expect(redacted).not.toContain(secret);
      }
    }
  });
});

describe("formatError", () => {
  it("returns message from Error instances", () => {
    expect(formatError(new Error("connection refused"))).toBe("connection refused");
  });

  it("returns string errors as-is", () => {
    expect(formatError("validation failed")).toBe("validation failed");
  });

  it("returns message from objects with a message field", () => {
    expect(formatError({ message: "not authorized" })).toBe("not authorized");
  });

  it("returns a safe fallback for unknown values", () => {
    expect(formatError(null)).toBe("An unknown error occurred");
    expect(formatError(undefined)).toBe("An unknown error occurred");
    expect(formatError(42)).toBe("An unknown error occurred");
  });
});
