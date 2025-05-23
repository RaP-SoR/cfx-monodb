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
