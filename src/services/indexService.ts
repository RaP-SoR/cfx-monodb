import type { Db, IndexDescription } from "mongodb";
import { log, parseInitIndexes } from "../utils";

export type IndexSpec = {
  keys: Record<string, 1 | -1>;
  options?: Record<string, unknown>;
};

const MAX_INDEXES_PER_COLLECTION = 20;

export async function ensureIndexesForCollection(
  db: Db,
  collectionName: string,
  specs: IndexSpec[]
): Promise<number> {
  if (!Array.isArray(specs) || specs.length === 0) {
    throw new Error("No index specs provided");
  }

  const models = specs.slice(0, MAX_INDEXES_PER_COLLECTION).map((it) => ({
    key: it.keys,
    ...(it.options ? { ...it.options } : {}),
  }));

  await db
    .collection(collectionName)
    .createIndexes(models as IndexDescription[]);
  log("info", `Indexes ensured for ${collectionName}: ${models.length}`);
  return models.length;
}

export async function ensureIndexesFromConvar(db: Db): Promise<void> {
  const specs = parseInitIndexes();
  if (!specs) return;

  for (const [colName, indexes] of Object.entries(specs)) {
    try {
      await ensureIndexesForCollection(db, colName, indexes);
    } catch (e) {
      log(
        "warn",
        `Failed to ensure indexes for ${colName}: ${(e as Error).message}`
      );
    }
  }
}
