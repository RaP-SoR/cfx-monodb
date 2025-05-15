import { MongoClient, Db } from "mongodb";
import dbConfig from "./config";
import { register } from "module";
import { registerExports } from "./exports";

class MongoDBConnector {
  private static instance: MongoDBConnector;
  private isConnected: boolean = false;
  private connectionString: string;
  private options: any;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor() {
    this.connectionString = dbConfig.mongoUrl;
    this.options = dbConfig.options;
    console.log(
      `[CFX-MongoDB] Configuring connection with ${this.connectionString}`
    );
  }

  public static getInstance(): MongoDBConnector {
    if (!MongoDBConnector.instance) {
      MongoDBConnector.instance = new MongoDBConnector();
    }
    return MongoDBConnector.instance;
  }

  public async connect(url?: string, options?: object): Promise<void> {
    if (url) {
      if (this.isConnected) {
        MongoDBConnector.getInstance().disconnect();
        console.log(
          "[CFX-MongoDB] Disconnecting existing connection for Confuguration"
        );
      }
      this.connectionString = url;
      this.options = options;
      console.log(
        `[CFX-MongoDB] Remote Configuring connection with ${this.connectionString}`
      );
    }
    if (this.isConnected) {
      console.log("[CFX-MongoDB] Connection already established");
      return;
    }

    try {
      this.client = new MongoClient(this.connectionString, this.options);
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      console.log("[CFX-MongoDB] Successfully connected");
      TriggerEvent("cfx-mongodb:connected", true);
      registerExports(this);
    } catch (error) {
      console.error("[CFX-MongoDB] Connection error:", error);
      console.log(
        `[CFX-MongoDB] Connection failed with URL: ${this.connectionString}`
      );
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.log("[CFX-MongoDB] No connection available");
      return;
    }

    try {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      this.db = null;
      console.log("[CFX-MongoDB] Connection successfully closed");
    } catch (error) {
      console.error("[CFX-MongoDB] Error while disconnecting:", error);
      throw error;
    }
  }

  public isDbConnected(): boolean {
    return this.isConnected;
  }

  public getDb(): Db | null {
    return this.db;
  }

  public async getAllCollections(): Promise<string[]> {
    if (!this.isConnected || !this.db) {
      console.log("[CFX-MongoDB] No connection available");
      return [];
    }

    try {
      const collections = await this.db.listCollections().toArray();
      return collections.map((collection) => collection.name);
    } catch (error) {
      console.error("[CFX-MongoDB] Error fetching collections:", error);
      return [];
    }
  }
}

export default MongoDBConnector;
