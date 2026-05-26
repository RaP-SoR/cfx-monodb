import MongoDBConnector from "../connector";
import { exportFn, log } from "../utils";
import { registerReadHandlers } from "./handlers/read";
import { registerWriteHandlers } from "./handlers/write";
import { registerAdminHandlers } from "./handlers/admin";
import { registerLifecycleHandlers } from "./handlers/lifecycle";

export function registerExports(mongoDBInstance: MongoDBConnector): void {
  registerWriteHandlers(mongoDBInstance, exportFn);
  registerReadHandlers(mongoDBInstance, exportFn);
  registerAdminHandlers(mongoDBInstance, exportFn);
  registerLifecycleHandlers(mongoDBInstance, exportFn);
  log("info", "Exports registered with TypeScript generics support");
}
