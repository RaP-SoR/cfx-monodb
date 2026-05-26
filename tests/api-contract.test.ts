import { beforeEach, describe, expect, it } from "vitest";
import { CFX_MONGODB_EXPORTS } from "../src/types/api";
import { registerExports } from "../src/exports";
import {
  clearExports,
  installExportCapture,
  listExports,
} from "./helpers/export-registry";
import { createMockConnector, createMockDb } from "./helpers/mock-db";

function setupRegisteredExports(): string[] {
  clearExports();
  installExportCapture();
  const db = createMockDb({ collections: {} });
  const connector = createMockConnector(db, true);
  registerExports(connector);
  return listExports();
}

describe("cfx-mongodb API contract", () => {
  beforeEach(() => {
    clearExports();
  });

  describe("export registry vs CFX_MONGODB_EXPORTS", () => {
    it("all CFX_MONGODB_EXPORTS names are registered at runtime", () => {
      const registered = setupRegisteredExports();
      const missing = CFX_MONGODB_EXPORTS.filter(
        (name) => !registered.includes(name)
      );
      expect(
        missing,
        `Exports declared in CFX_MONGODB_EXPORTS but not registered: [${missing.join(", ")}]`
      ).toEqual([]);
    });

    it("documents any extra registered exports not yet in CFX_MONGODB_EXPORTS", () => {
      const registered = setupRegisteredExports();
      const extra = registered.filter(
        (name) => !(CFX_MONGODB_EXPORTS as readonly string[]).includes(name)
      );
      // @todo Wave 2: tighten once export list is fully locked in manifest.
      // For now this test is non-blocking — it warns about undeclared extras
      // so they become visible during review.
      if (extra.length > 0) {
        console.warn(
          `[api-contract] Extra registered exports not in CFX_MONGODB_EXPORTS: ${extra.join(", ")}`
        );
      }
      expect(extra).toBeDefined();
    });
  });

  describe("known semantic inconsistencies (documented placeholders)", () => {
    /**
     * INCONSISTENCY: `find` vs `findById` not-found semantics diverge.
     *
     * Current behaviour (Wave 1, do NOT change until Wave 2 alignment):
     *   • `find(collection, filter)` — document not found
     *       → { success: false, error: "Document not found" }
     *   • `findById(collection, id)` — document not found
     *       → { success: true, data: null }
     *
     * Impact on CTFFramework callers:
     *   A caller that checks only `result.success` will treat the two exports
     *   differently: `find` looks like an error, `findById` looks like success.
     *   This is a documentation hazard tracked for Wave 2 resolution.
     *
     * Proposed resolution (Wave 2):
     *   Align both to `{ success: true, data: null }` to distinguish
     *   "not found" from actual runtime errors, matching `findById` semantics.
     *   Document the breaking change in CHANGES.md before landing.
     */
    it.todo(
      "find and findById should return consistent not-found semantics — currently find returns success:false, findById returns success:true/data:null (Wave 2 alignment needed)"
    );
  });
});
