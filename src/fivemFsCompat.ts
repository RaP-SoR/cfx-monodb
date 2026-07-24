/**
 * @file FiveM Node FS sandbox compat — stubs mongodb@7 `.dockerenv` probes.
 *
 * The official MongoDB driver calls `fs.promises.access('/.dockerenv')` in
 * `getContainerMetadata()`. FiveM's Node sandbox blocks absolute FS reads
 * outside the resource VFS (`Access to this API has been restricted`).
 *
 * Official Cfx workaround:
 * https://docs.fivem.net/docs/scripting-manual/migrating-from-other-platforms/
 *
 * Must load before `MongoClient` is constructed (see `src/index.ts`).
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

const INSTALL_FLAG = Symbol.for("cfx-mongodb.fivemFsCompat");

type GlobalWithFlag = typeof globalThis & {
  [INSTALL_FLAG]?: boolean;
};

/**
 * True when `path` is a Docker-env probe used by the MongoDB driver
 * (e.g. `/.dockerenv`, `C:\.dockerenv`, `./.dockerenv`, Buffer/URL forms).
 */
export function isDockerEnvProbe(path: unknown): boolean {
  const normalized = normalizePathInput(path);
  if (normalized === null) {
    return false;
  }
  return (
    normalized === ".dockerenv" ||
    normalized.endsWith("/.dockerenv") ||
    normalized.endsWith("\\.dockerenv")
  );
}

function normalizePathInput(path: unknown): string | null {
  if (typeof path === "string") {
    return path.replace(/\\/g, "/").replace(/\/+$/, "") || path;
  }
  if (Buffer.isBuffer(path)) {
    return normalizePathInput(path.toString("utf8"));
  }
  if (path instanceof URL) {
    return normalizeFileUrl(path);
  }
  if (
    path !== null &&
    typeof path === "object" &&
    "href" in path &&
    typeof (path as { href: unknown }).href === "string"
  ) {
    try {
      return normalizeFileUrl(new URL((path as { href: string }).href));
    } catch {
      return null;
    }
  }
  return null;
}

/** Prefer pathname when `fileURLToPath` rejects non-absolute file URLs (Windows). */
function normalizeFileUrl(url: URL): string | null {
  if (url.protocol !== "file:") {
    return null;
  }
  try {
    return normalizePathInput(fileURLToPath(url));
  } catch {
    return normalizePathInput(url.pathname);
  }
}

function createEnoent(path: unknown): NodeJS.ErrnoException {
  const err = new Error(
    `ENOENT: no such file or directory, access '${String(path)}'`
  ) as NodeJS.ErrnoException;
  err.code = "ENOENT";
  err.errno = -2;
  err.syscall = "access";
  err.path = typeof path === "string" ? path : String(path);
  return err;
}

/**
 * Idempotently patch `fs.promises.access` so `.dockerenv` probes fail with ENOENT
 * (driver treats that as “not in a container”) instead of FiveM sandbox errors.
 */
export function installFivemFsCompat(): void {
  const g = globalThis as GlobalWithFlag;
  if (g[INSTALL_FLAG]) {
    return;
  }

  const originalAccess = fs.promises.access.bind(fs.promises);

  fs.promises.access = (async (
    path: fs.PathLike,
    mode?: number
  ): Promise<void> => {
    if (isDockerEnvProbe(path)) {
      throw createEnoent(path);
    }
    return originalAccess(path, mode);
  }) as typeof fs.promises.access;

  g[INSTALL_FLAG] = true;
}

installFivemFsCompat();
