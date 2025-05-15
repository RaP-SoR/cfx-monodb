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
    "insertOne",
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
    "find",
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
    "findOne",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {}
    ): Promise<Response<T | null>> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const result = await db.collection<T>(collectionName).findOne(query);
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
    "updateOne",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>,
      update: UpdateFilter<T> | Partial<T>
    ): Promise<UpdateResponse | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const updateDoc: UpdateFilter<T> =
          "$set" in update ? update : { $set: update as Partial<T> };

        const result = await db
          .collection<T>(collectionName)
          .updateOne(filter, updateDoc);
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
    "deleteOne",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>
    ): Promise<DeleteResponse | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const result = await db.collection<T>(collectionName).deleteOne(filter);
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
  exports("testex", (): string => {
    console.error("Testex");
    return "Test Result";
  });
  console.log(
    "[CFX-MongoDB] Exports registered with TypeScript generics support"
  );
}
