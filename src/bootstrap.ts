import MongoDBConnector from "./connector";
import { registerExports } from "./exports";
import { ensureIndexesFromConvar } from "./services/indexService";
import { log } from "./utils";

on("onResourceStart", async (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.connect();
      registerExports(mongodb);
      if (mongodb.isDbConnected()) {
        log("info", "Connected successfully");
        const db = mongodb.getDb();
        if (db) {
          await ensureIndexesFromConvar(db);
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
