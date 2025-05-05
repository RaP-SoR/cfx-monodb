import { MongoClient, Db } from "mongodb";
import dbConfig from "./config";

class MongoDBConnector {
  private static instance: MongoDBConnector;
  private isConnected: boolean = false;
  private connectionString: string;
  private options: any;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {
    this.connectionString = dbConfig.mongoUrl;
    this.options = dbConfig.options;

    console.log(
      `[MongoDB] Configuring connection with ${this.connectionString}`
    );
  }

  public static getInstance(): MongoDBConnector {
    if (!MongoDBConnector.instance) {
      MongoDBConnector.instance = new MongoDBConnector();
    }
    return MongoDBConnector.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("[MongoDB] Connection already established");
      return;
    }

    try {
      this.client = new MongoClient(this.connectionString, this.options);
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      console.log("[MongoDB] Successfully connected");
    } catch (error) {
      console.error("[MongoDB] Connection error:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.log("[MongoDB] No connection available");
      return;
    }

    try {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      this.db = null;
      console.log("[MongoDB] Connection successfully closed");
    } catch (error) {
      console.error("[MongoDB] Error while disconnecting:", error);
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
      console.log("[MongoDB] No connection available");
      return [];
    }

    try {
      const collections = await this.db.listCollections().toArray();
      return collections.map((collection) => collection.name);
    } catch (error) {
      console.error("[MongoDB] Error fetching collections:", error);
      return [];
    }
  }
}

export default MongoDBConnector;
