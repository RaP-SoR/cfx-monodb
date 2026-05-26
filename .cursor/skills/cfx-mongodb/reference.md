# cfx-mongodb — API Quick Reference

Canonical source: [docs/API.md](../../../docs/API.md)

## Response types

```typescript
interface CfxMongoResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CfxMongoInsertResult {
  success: boolean;
  insertedId?: string;
  error?: string;
}

interface CfxMongoUpdateResult {
  success: boolean;
  modifiedCount?: number;
  matchedCount?: number;
  error?: string;
}

interface CfxMongoDeleteResult {
  success: boolean;
  deletedCount?: number;
  error?: string;
}
```

## Export signatures

```typescript
exports["cfx-mongodb"] = {
  find(collection: string, filter: object): Promise<CfxMongoResult>,
  findAll(collection: string, filter: object, options?: {
    limit?: number;
    skip?: number;
    sort?: Record<string, 1 | -1>;
    projection?: object;
  }): Promise<CfxMongoResult<unknown[]>>,
  insert(collection: string, doc: object): Promise<CfxMongoInsertResult>,
  update(collection: string, filter: object, update: object): Promise<CfxMongoUpdateResult>,
  delete(collection: string, filter: object): Promise<CfxMongoDeleteResult>,
  count(collection: string, filter: object): Promise<CfxMongoResult<number>>,
  getVersion(): Promise<string>,
  findById(collection: string, id: string, projection?: object): Promise<CfxMongoResult>,
  getDb(): Db | null,
  // Extended (not CTFFramework-required):
  ensureIndexes(collection: string, specs: object[]): Promise<CfxMongoResult<number>>,
  health(): Promise<CfxMongoResult<{ ok: boolean; rttMs: number }>>,
  config(): Promise<CfxMongoResult<Record<string, unknown>>>,
  isConnected(): boolean,
  connect(url: string, options?: object): Promise<void>,
  disconnect(): Promise<void>,
};
```

## findAll defaults

- `limit`: 100 (clamped 1–1000)
- `skip`: 0 (clamped 0–1_000_000)
- `sort`: optional

## _id handling

String `_id` in filters for `find`, `update`, `delete` → converted to ObjectId internally.
Returned documents have `_id` as string.

## Events

- `cfx-mongodb:ready` — safe to call CRUD exports
- `cfx-mongodb:connected` — after connect attempt

## Denied operators

`$where`, `$function`, `$accumulator`, `$regexFind`, `$regexFindAll`, `$out`, `$merge`
