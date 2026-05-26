import { registerExports } from "../../src/exports";
import {
  clearExports,
  installExportCapture,
} from "./export-registry";
import {
  createMockDb,
  createMockConnector,
  type MockDbState,
} from "./mock-db";
import type { Db } from "mongodb";

export function registerWithDb(state: MockDbState, connected = true) {
  const db = connected ? createMockDb(state) : null;
  const connector = createMockConnector(db, connected);
  clearExports();
  installExportCapture();
  registerExports(connector);
  return { db: db as Db | null, state, connector };
}
