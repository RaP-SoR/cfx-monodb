import MongoDBConnector from "./connector";
import { registerExports } from "./exports";
import { log, parseInitIndexes } from "./utils";

on("onResourceStart", async (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.connect();
      registerExports(mongodb);
      if (mongodb.isDbConnected()) {
        log("info", "Connected successfully");
        const specs = parseInitIndexes();
        if (specs) {
          const db = mongodb.getDb();
          if (db) {
            for (const [colName, indexes] of Object.entries(specs)) {
              try {
                const models = indexes.map(
                  (it: {
                    keys: Record<string, 1 | -1>;
                    options?: Record<string, unknown>;
                  }) => ({
                    key: it.keys,
                    ...(it.options ? { ...it.options } : {}),
                  })
                );
                await db
                  .collection(colName)
                  .createIndexes(
                    models as import("mongodb").IndexDescription[]
                  );
                log("info", `Indexes ensured for ${colName}: ${indexes.length}`);
              } catch (e) {
                log(
                  "warn",
                  `Failed to ensure indexes for ${colName}: ${(e as Error).message}`
                );
              }
            }
          }
        }
      }
      log("info", `${resourceName} started and MongoDB connected`);
      TriggerEvent("cfx-mongodb:ready");
    } catch (error) {
      log(
        "error",
        `Failed to start ${resourceName}: ${(error as Error).message}`
      );
    }
  }
});

on("onResourceStop", async (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.disconnect();
      log("info", `${resourceName} stopped and MongoDB disconnected`);
    } catch (error) {
      log(
        "error",
        `Error while stopping ${resourceName}: ${(error as Error).message}`
      );
    }
  }
});
