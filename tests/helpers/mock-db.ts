import { ObjectId, type Db } from "mongodb";
import { vi } from "vitest";
import type MongoDBConnector from "../../src/connector";

export interface MockCollection {
  insertOne: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
  updateOne: ReturnType<typeof vi.fn>;
  deleteOne: ReturnType<typeof vi.fn>;
  countDocuments: ReturnType<typeof vi.fn>;
  createIndexes: ReturnType<typeof vi.fn>;
}

export interface MockDbState {
  collections: Record<string, MockCollection>;
  command?: ReturnType<typeof vi.fn>;
}

export function createMockCollection(
  overrides: Partial<MockCollection> = {}
): MockCollection {
  const cursor = {
    limit: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
  };

  return {
    insertOne: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn().mockReturnValue(cursor),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    countDocuments: vi.fn(),
    createIndexes: vi.fn(),
    ...overrides,
  };
}

export function createMockDb(state: MockDbState): Db {
  return {
    collection: vi.fn((name: string) => {
      if (!state.collections[name]) {
        state.collections[name] = createMockCollection();
      }
      return state.collections[name];
    }),
    command: state.command ?? vi.fn().mockResolvedValue({ ok: 1 }),
    databaseName: "test_db",
  } as unknown as Db;
}

export function createMockConnector(
  db: Db | null,
  connected: boolean
): MongoDBConnector {
  return {
    getDb: () => (connected ? db : null),
    isDbConnected: () => connected,
  } as unknown as MongoDBConnector;
}

export { ObjectId };
