# Shared interfaces — Wave 2–3 (archived spec)

> **Archived.** Target shapes were implemented on `dev`. See
> [ARCHITECTURE.md](../../ARCHITECTURE.md) for the current module layout and
> [src/api/withDb.ts](../../../src/api/withDb.ts) for the live pipeline.

> **Do not implement in Wave 1.** Architects and Wave 2/3 agents use this as the contract target.

## DbProvider (Wave 2)

Replaces direct `MongoDBConnector` dependency in export handlers.

```typescript
import type { Db } from "mongodb";

export interface DbProvider {
  getDb(): Db | null;
  isDbConnected(): boolean;
}
```

`MongoDBConnector` implements this interface after Wave 3 bootstrap refactor.

---

## withDb pipeline (Wave 2)

```typescript
import type { Db } from "mongodb";
import type { Response } from "../responses";

export async function withDb<T>(
  provider: DbProvider,
  op: (db: Db) => Promise<T>
): Promise<Response<T>>;
```

Responsibilities:

- Return `{ success: false, error: "Database not connected" }` when no db
- Catch errors → `{ success: false, error: formatError(e) }`
- Log via `log("error", ...)` — never `console.*`
- Never throw to caller

---

## normalizeIdFilter (Wave 2)

Centralize `_id` string → ObjectId conversion for `find`, `update`, `delete`.

```typescript
import type { Document } from "mongodb";

export function normalizeIdFilter<T extends Document>(filter: T): T;
```

---

## Handler module layout (Wave 3)

```
src/api/
  registerExports.ts    # wiring only
  withDb.ts
  normalizeIdFilter.ts
  handlers/
    insert.ts
    find.ts
    findAll.ts
    findById.ts
    update.ts
    delete.ts
    count.ts
    lifecycle.ts        # connect, disconnect, isConnected, getDb
    admin.ts            # health, config, ensureIndexes, getVersion
```

`src/exports.ts` becomes a thin re-export shim for one release, then removed.

---

## IndexService (Wave 3)

```typescript
import type { Db } from "mongodb";
import type { IndexDescription } from "mongodb";

export type IndexSpec = {
  keys: Record<string, 1 | -1>;
  options?: Record<string, unknown>;
};

export async function ensureIndexesForCollection(
  db: Db,
  collectionName: string,
  specs: IndexSpec[]
): Promise<number>;

export async function ensureIndexesFromConvar(db: Db): Promise<void>;
```

Used by `bootstrap.ts` (startup) and `admin.ts` export (`ensureIndexes`).
