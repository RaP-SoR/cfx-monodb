import MongoDBConnector from "../../connector";
import { log, redactMongoUri } from "../../utils";
import type { DbProvider } from "../../types/dbProvider";

export function registerLifecycleHandlers(
  provider: DbProvider,
  register: (name: string, fn: Function) => void
): void {
  register("isConnected", (): boolean => {
    return provider?.isDbConnected() || false;
  });

  register("getDb", () => {
    return provider.getDb();
  });

  register(
    "connect",
    async (
      connectionURL: string,
      options?: import("../../types/options").MongoOptions
    ) => {
      try {
        const mongodb = MongoDBConnector.getInstance();
        await mongodb.connect(connectionURL, options);
        log("info", `Connected with URL: ${redactMongoUri(connectionURL)}`);
        TriggerEvent("cfx-mongodb:connected", true);
      } catch (error) {
        log(
          "error",
          `Connection error: ${error instanceof Error ? error.message : String(error)}`
        );
        TriggerEvent(
          "cfx-mongodb:connected",
          false,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  register("disconnect", async () => {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.disconnect();
      log("info", "Disconnected");
      TriggerEvent("cfx-mongodb:disconnected", true);
    } catch (error) {
      log(
        "error",
        `Disconnection error: ${error instanceof Error ? error.message : String(error)}`
      );
      TriggerEvent(
        "cfx-mongodb:disconnected",
        false,
        error instanceof Error ? error.message : String(error)
      );
    }
  });
}
