import {
  Filter,
  OptionalUnlessRequiredId,
  Document,
  UpdateFilter,
  FindOptions,
} from "mongodb";
import {
  Response,
  ErrorResponse,
  InsertResponse,
  UpdateResponse,
  DeleteResponse,
} from "./responses";
import MongoDBConnector from "./connector";

export function registerExports(mongoDBInstance: MongoDBConnector): void {
  global.exports(
    "insert",
    async <T extends Document>(
      collectionName: string,
      document: OptionalUnlessRequiredId<T>
    ): Promise<InsertResponse | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const result = await db
          .collection<T>(collectionName)
          .insertOne(document);
        return { success: true, insertedId: result.insertedId };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] insertOne error:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    }
  );

  exports(
    "findAll",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {},
      options: FindOptions<T> = {}
    ): Promise<Response<T[]>> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const result = await db
          .collection<T>(collectionName)
          .find(query, options)
          .toArray();

        for (const doc of result) {
          if (doc._id && typeof doc._id === "object" && doc._id.toString) {
            (doc._id as any) = doc._id.toString();
          }
        }

        return { success: true, data: result as unknown as T[] };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] find error:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    }
  );

  exports(
    "find",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {}
    ): Promise<Response<T | null>> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const result = await db.collection<T>(collectionName).findOne(query);
        if (!result) {
          return { success: false, error: "Document not found" };
        }

        if (
          result._id &&
          typeof result._id === "object" &&
          result._id.toString
        ) {
          const idString = result._id.toString();
          // Dann die ID als String setzen
          (result as any)._id = idString;
        }

        return { success: true, data: result as T | null };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] findOne error:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    }
  );
  exports(
    "update",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>,
      update: UpdateFilter<T> | Partial<T>
    ): Promise<UpdateResponse | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        // Konvertiere String-IDs in ObjectIDs
        if (filter && typeof filter === "object") {
          // ID-Konvertierungslogik für _id
          if (filter._id && typeof filter._id === "string") {
            try {
              const { ObjectId } = require("mongodb");
              if (ObjectId.isValid(filter._id)) {
                filter._id = new ObjectId(filter._id);
              }
            } catch (err) {
              console.warn(
                "Failed to convert string _id to ObjectId:",
                filter._id
              );
            }
          }
        }

        console.log(
          `[CFX-MongoDB] Updating with filter: ${JSON.stringify(filter)}`
        );

        const updateDoc: UpdateFilter<T> =
          "$set" in update ? update : { $set: update as Partial<T> };

        const result = await db
          .collection<T>(collectionName)
          .updateOne(filter, updateDoc);

        console.log(
          `[CFX-MongoDB] Update result: matched=${result.matchedCount}, modified=${result.modifiedCount}`
        );

        return {
          success: true,
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] updateOne error:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    }
  );
  exports(
    "delete",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>
    ): Promise<DeleteResponse | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const result = await db.collection<T>(collectionName).deleteOne(filter);
        if (result.deletedCount === 0) {
          return { success: false, error: "Document not found" };
        }
        if (result.deletedCount > 1) {
          console.warn(
            `[CFX-MongoDB] Warning: More than one document deleted (${result.deletedCount})`
          );
        }
        console.log(
          `[CFX-MongoDB] Deleted document with filter: ${JSON.stringify(
            filter
          )}`
        );
        return { success: true, deletedCount: result.deletedCount };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] deleteOne error:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    }
  );
  exports(
    "count",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T> = {}
    ): Promise<Response<number>> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const count = await db
          .collection<T>(collectionName)
          .countDocuments(filter);
        return { success: true, data: count };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] countDocuments error:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    }
  );
  exports("isConnected", (): boolean => {
    return mongoDBInstance?.isDbConnected() || false;
  });

  exports("connect", async (connectionURL: string, options?: object) => {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.connect(connectionURL, options);

      console.log(`CFX-MongoDB verbunden mit URL: ${connectionURL}`);
      emitNet("cfx-mongodb:connected", source, true);
    } catch (error) {
      console.error("CFX-MongoDB Verbindungsfehler:", error);
      emitNet("cfx-mongodb:connected", source, false, (error as Error).message);
    }
  });

  exports("disconnect", async () => {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.disconnect();
      console.log(`CFX-MongoDB disconnected`);
      emitNet("cfx-mongodb:disconnected", source, true);
    } catch (error) {
      console.error("CFX-MongoDB Disconnection error:", error);
      emitNet(
        "cfx-mongodb:disconnected",
        source,
        false,
        (error as Error).message
      );
    }
  });
  console.log(
    "[CFX-MongoDB] Exports registered with TypeScript generics support"
  );
}
