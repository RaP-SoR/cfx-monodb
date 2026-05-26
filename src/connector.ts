import { MongoClient, Db } from "mongodb";
import dbConfig from "./config";
import type { MongoOptions } from "./types/options";
import { registerExports } from "./exports";
import { log, redactMongoUri } from "./utils";

class MongoDBConnector {
  private static instance: MongoDBConnector;
  private isConnected: boolean = false;
  private connectionString: string;
  private options: MongoOptions | undefined;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor() {
    this.connectionString = dbConfig.mongoUrl;
    this.options = dbConfig.options;
    log(
      "info",
      `Configuring connection with ${redactMongoUri(this.connectionString)}`
    );
  }

  public static getInstance(): MongoDBConnector {
    if (!MongoDBConnector.instance) {
      MongoDBConnector.instance = new MongoDBConnector();
    }
    return MongoDBConnector.instance;
  }

  public async connect(url?: string, options?: MongoOptions): Promise<void> {
    if (url) {
      if (this.isConnected) {
        await this.disconnect();
        log("info", "Disconnecting existing connection for configuration");
      }
      this.connectionString = url;
      this.options = options;
      log(
        "info",
        `Remote configuring connection with ${redactMongoUri(this.connectionString)}`
      );
    }
    if (this.isConnected) {
      log("info", "Connection already established");
      return;
    }

    try {
      const opts: MongoOptions = {
        ...(this.options || {}),
        serverSelectionTimeoutMS:
          (this.options && this.options.serverSelectionTimeoutMS) ||
          dbConfig.options.serverSelectionTimeoutMS,
      };
      this.client = new MongoClient(
        this.connectionString,
        opts as import("mongodb").MongoClientOptions
      );
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      log("info", "Successfully connected");
      TriggerEvent("cfx-mongodb:connected", true);
      registerExports(this);
    } catch (error) {
      log(
        "error",
        `Connection error: ${error instanceof Error ? error.message : String(error)}`
      );
      log(
        "error",
        `Connection failed with URL: ${redactMongoUri(this.connectionString)}`
      );
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) {
      log("info", "No connection available");
      return;
    }

    try {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      this.db = null;
      log("info", "Connection successfully closed");
    } catch (error) {
      log(
        "error",
        `Error while disconnecting: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  public isDbConnected(): boolean {
    return this.isConnected;
  }

  public getDb(): Db | null {
    return this.db;
  }
}

export default MongoDBConnector;
