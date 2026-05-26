import type { Db } from "mongodb";
import type { DbProvider } from "../types/dbProvider";
import type { Response } from "../responses";
import { formatError, log } from "../utils";

export async function withDb<T>(
  provider: DbProvider,
  op: (db: Db) => Promise<T>
): Promise<Response<T>> {
  const db = provider.getDb();
  if (!db) {
    return { success: false, error: "Database not connected" };
  }

  try {
    const data = await op(db);
    return { success: true, data };
  } catch (err) {
    log("error", `withDb error: ${formatError(err)}`);
    return { success: false, error: formatError(err) };
  }
}
