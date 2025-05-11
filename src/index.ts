import MongoDBConnector from "./connector";

on("onResourceStart", async (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.connect();
      console.log(`${resourceName} started and MongoDB connected`);
    } catch (error) {
      console.error(`Failed to start ${resourceName}:`, error);
    }
  }
});

on("onResourceStop", async (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.disconnect();
      console.log(`${resourceName} stopped and MongoDB disconnected`);
    } catch (error) {
      console.error(`Error while stopping ${resourceName}:`, error);
    }
  }
});

onNet("cfx-mongodb:connect", async (connectionURL: string, options?: object) => {
  try {
    const mongodb = MongoDBConnector.getInstance();
    await mongodb.connect(connectionURL, options);
    

    console.log(`MongoDB verbunden mit URL: ${connectionURL}`);
    emitNet("cfx-mongodb:connected", source, true);
  } catch (error) {
    console.error("MongoDB Verbindungsfehler:", error);
    emitNet("cfx-mongodb:connected", source, false, (error as Error).message);
  }
});


