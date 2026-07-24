import { describe, expect, it, vi } from "vitest";
import * as fs from "fs";
import { pathToFileURL } from "url";
import {
  installFivemFsCompat,
  isDockerEnvProbe,
} from "../src/fivemFsCompat";

const INSTALL_FLAG = Symbol.for("cfx-mongodb.fivemFsCompat");

describe("isDockerEnvProbe", () => {
  it("detects absolute Unix and Windows dockerenv paths", () => {
    expect(isDockerEnvProbe("/.dockerenv")).toBe(true);
    expect(isDockerEnvProbe("C:\\.dockerenv")).toBe(true);
    expect(isDockerEnvProbe("C:/.dockerenv")).toBe(true);
  });

  it("detects relative and bare dockerenv paths", () => {
    expect(isDockerEnvProbe("./.dockerenv")).toBe(true);
    expect(isDockerEnvProbe(".dockerenv")).toBe(true);
  });

  it("detects Buffer and file URL forms", () => {
    expect(isDockerEnvProbe(Buffer.from("/.dockerenv"))).toBe(true);
    expect(isDockerEnvProbe(pathToFileURL("/.dockerenv"))).toBe(true);
    expect(isDockerEnvProbe({ href: "file:///.dockerenv" })).toBe(true);
  });

  it("rejects unrelated paths", () => {
    expect(isDockerEnvProbe("/tmp/data.json")).toBe(false);
    expect(isDockerEnvProbe("./package.json")).toBe(false);
    expect(isDockerEnvProbe(Buffer.from("/etc/passwd"))).toBe(false);
    expect(isDockerEnvProbe(null)).toBe(false);
    expect(isDockerEnvProbe(42)).toBe(false);
    expect(isDockerEnvProbe({ href: "https://example.com/.dockerenv" })).toBe(
      false
    );
  });
});

describe("installFivemFsCompat", () => {
  it("stubs dockerenv probes with ENOENT (module side-effect)", async () => {
    await expect(fs.promises.access("/.dockerenv")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(fs.promises.access("C:\\.dockerenv")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(fs.promises.access("./.dockerenv")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      fs.promises.access(Buffer.from("/.dockerenv"))
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("is idempotent", () => {
    const before = fs.promises.access;
    installFivemFsCompat();
    installFivemFsCompat();
    expect(fs.promises.access).toBe(before);
  });

  it("forwards non-probe paths to the original access", async () => {
    const forward = vi.fn().mockResolvedValue(undefined);
    const previous = fs.promises.access;

    Object.defineProperty(fs.promises, "access", {
      configurable: true,
      writable: true,
      value: forward,
    });
    delete (globalThis as Record<symbol, unknown>)[INSTALL_FLAG];
    installFivemFsCompat();

    await expect(
      fs.promises.access("./package.json", fs.constants.F_OK)
    ).resolves.toBeUndefined();
    expect(forward).toHaveBeenCalledWith("./package.json", fs.constants.F_OK);

    await expect(fs.promises.access("/.dockerenv")).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(forward).toHaveBeenCalledTimes(1);

    Object.defineProperty(fs.promises, "access", {
      configurable: true,
      writable: true,
      value: previous,
    });
    delete (globalThis as Record<symbol, unknown>)[INSTALL_FLAG];
    installFivemFsCompat();
  });
});
