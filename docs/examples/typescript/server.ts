/**
 * Minimal TypeScript consumer for cfx-mongodb.
 * Reference only — compile to dist/example.js for fxmanifest-ts-example.lua in this folder.
 *
 * server.cfg: ensure cfx-mongodb BEFORE this resource.
 */

on("cfx-mongodb:ready", async () => {
  const mongo = exports["cfx-mongodb"];

  if (!mongo.isConnected()) {
    console.warn("[example] isConnected=false after ready event");
    return;
  }

  const version = await mongo.getVersion();
  console.log("[example] getVersion:", version);

  const health = await mongo.health();
  console.log("[example] health:", JSON.stringify(health));

  await mongo.ensureIndexes("users", [
    { keys: { email: 1 }, options: { unique: true } },
    { keys: { createdAt: -1 } },
  ]);

  const ins = await mongo.insert("users", {
    email: "user@example.com",
    createdAt: new Date().toISOString(),
    active: true,
    job: "admin",
  });
  console.log("[example] insert:", JSON.stringify(ins));

  if (!ins.success || !ins.insertedId) {
    console.error("[example] insert failed:", ins.error);
    return;
  }

  const byFilter = await mongo.find("users", { email: "user@example.com" });
  console.log("[example] find:", JSON.stringify(byFilter));

  const missing = await mongo.find("users", { email: "__no_such_user__" });
  if (missing.success && missing.data === null) {
    console.log("[example] find not-found: success true, data null");
  }

  const byId = await mongo.findById("users", ins.insertedId, { email: 1 });
  console.log("[example] findById:", JSON.stringify(byId));

  const many = await mongo.findAll(
    "users",
    { active: true },
    {
      projection: { email: 1, createdAt: 1 },
      sort: { createdAt: -1 },
      limit: 25,
      skip: 0,
    }
  );
  console.log("[example] findAll:", JSON.stringify(many));

  const staff = await mongo.findAll(
    "users",
    { job: { $in: ["admin", "moderator"] } },
    { limit: 10 }
  );
  console.log("[example] findAll $in:", JSON.stringify(staff));

  const upd = await mongo.update(
    "users",
    { _id: ins.insertedId },
    { $set: { active: false } }
  );
  console.log("[example] update:", JSON.stringify(upd));

  const cnt = await mongo.count("users", { active: false });
  console.log("[example] count:", JSON.stringify(cnt));

  const del = await mongo.delete("users", { _id: ins.insertedId });
  console.log("[example] delete:", JSON.stringify(del));

  const delMissing = await mongo.delete("users", { _id: ins.insertedId });
  if (!delMissing.success) {
    console.log("[example] delete not-found:", delMissing.error);
  }

  const cfg = await mongo.config();
  console.log("[example] config:", JSON.stringify(cfg));
});
