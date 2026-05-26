import type { FindOptions, MongoClientOptions } from "mongodb";

export type MongoOptions = Pick<
  MongoClientOptions,
  "serverSelectionTimeoutMS" | "maxPoolSize" | "minPoolSize"
> & {
  serverSelectionTimeoutMS: number;
};

export type FindAllOptions = Pick<FindOptions, "projection" | "sort"> & {
  limit?: number;
  skip?: number;
};
