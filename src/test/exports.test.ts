import MongoDBConnector from "../connector";
import { registerExports } from "../exports";
import { Document } from "mongodb";

// Mock für die globalen exports
const mockExports: Record<string, any> = {};
(global as any).exports = mockExports;

// Mock für console
const originalConsole = { ...console };
beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsole.error;
  console.log = originalConsole.log;
});

// Mock für den MongoDB-Connector
const mockMongoDBConnector = {
  getDb: jest.fn(),
  isDbConnected: jest.fn().mockReturnValue(true),
} as unknown as MongoDBConnector;

// Testdaten-Interface
interface TestUser extends Document {
  _id?: string;
  name: string;
  level: number;
}

describe("MongoDB Exports", () => {
  beforeAll(() => {
    // Mock für die DB-Instanz
    const mockDb = {
      collection: jest.fn().mockImplementation((name) => {
        return {
          insertOne: jest.fn().mockResolvedValue({ insertedId: "mockId123" }),
          find: jest.fn().mockImplementation((query) => {
            return {
              toArray: jest
                .fn()
                .mockResolvedValue(
                  query.name === "testUser"
                    ? [{ _id: "mockId123", name: "testUser", level: 5 }]
                    : []
                ),
            };
          }),
          findOne: jest.fn().mockImplementation((query) => {
            if (query._id === "mockId123") {
              return Promise.resolve({
                _id: "mockId123",
                name: "testUser",
                level: 5,
              });
            }
            return Promise.resolve(null);
          }),
          updateOne: jest.fn().mockImplementation((filter, update) => {
            if (filter._id === "mockId123") {
              return Promise.resolve({ matchedCount: 1, modifiedCount: 1 });
            }
            return Promise.resolve({ matchedCount: 0, modifiedCount: 0 });
          }),
          deleteOne: jest.fn().mockImplementation((filter) => {
            if (filter._id === "mockId123") {
              return Promise.resolve({ deletedCount: 1 });
            }
            return Promise.resolve({ deletedCount: 0 });
          }),
        };
      }),
    };

    mockMongoDBConnector.getDb = jest.fn().mockReturnValue(mockDb);

    // Registriere Exports
    registerExports(mockMongoDBConnector);
  });

  describe("insertOne", () => {
    it("should successfully insert a document", async () => {
      const newUser: TestUser = { name: "testUser", level: 1 };
      const result = await mockExports.insertOne("users", newUser);

      expect(result.success).toBe(true);
      expect(result.insertedId).toBe("mockId123");
    });

    it("should handle database errors", async () => {
      // Temporär den Mock überschreiben, um einen Fehler zu simulieren
      const originalGetDb = mockMongoDBConnector.getDb;
      (mockMongoDBConnector.getDb as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Test DB error");
      });

      const newUser: TestUser = { name: "errorUser", level: 1 };
      const result = await mockExports.insertOne("users", newUser);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Test DB error");

      // Mock wiederherstellen
      mockMongoDBConnector.getDb = originalGetDb;
    });
  });

  describe("find", () => {
    it("should find documents matching a query", async () => {
      const result = await mockExports.find("users", {
        name: "testUser",
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("testUser");
    });

    it("should return empty array when no documents match", async () => {
      const result = await mockExports.find("users", {
        name: "nonExistentUser",
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("findOne", () => {
    it("should find a single document", async () => {
      const result = await mockExports.findOne("users", {
        _id: "mockId123",
      });

      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data?.name).toBe("testUser");
    });

    it("should return null when document is not found", async () => {
      const result = await mockExports.findOne("users", {
        _id: "nonExistentId",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("updateOne", () => {
    it("should update a document with $set operator", async () => {
      const result = await mockExports.updateOne(
        "users",
        { _id: "mockId123" },
        { $set: { level: 10 } }
      );

      expect(result.success).toBe(true);
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);
    });

    it("should update a document with partial object", async () => {
      const result = await mockExports.updateOne(
        "users",
        { _id: "mockId123" },
        { level: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.matchedCount).toBe(1);
    });
  });

  describe("deleteOne", () => {
    it("should delete a document", async () => {
      const result = await mockExports.deleteOne("users", {
        _id: "mockId123",
      });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
    });

    it("should return zero count when no document matches", async () => {
      const result = await mockExports.deleteOne("users", {
        _id: "nonExistentId",
      });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });
  });

  describe("isConnected", () => {
    it("should return connection status", () => {
      expect(mockExports.isConnected()).toBe(true);

      // Test für nicht verbundene Datenbank
      (mockMongoDBConnector.isDbConnected as jest.Mock).mockReturnValueOnce(
        false
      );
      expect(mockExports.isConnected()).toBe(false);
    });
  });
});
