import type { Db } from "mongodb";

export interface DbProvider {
  getDb(): Db | null;
  isDbConnected(): boolean;
}
