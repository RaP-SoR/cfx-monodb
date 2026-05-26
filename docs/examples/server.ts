// Example usage of cfx-mongodb exports from another resource script
// Ensure this file is compiled or used as reference for your server scripts.

// Connect with override (optional)
on("onResourceStart", async (res: string) => {
  if (res !== GetCurrentResourceName()) return;
  try {
    // Optional override URL and options
    // exports["cfx-mongodb"].connect("mongodb://localhost:27017/ctf_dev", { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });

    // Health check
    const health = await (exports as any)["cfx-mongodb"].health();
    console.log("[example] health:", JSON.stringify(health));

    // Ensure indexes manually (in addition to mongodb_init_indexes)
    await (exports as any)["cfx-mongodb"].ensureIndexes("users", [
      { keys: { email: 1 }, options: { unique: true } },
      { keys: { createdAt: -1 } },
    ]);

    // Insert
    const ins = await (exports as any)["cfx-mongodb"].insert("users", {
      email: "user@example.com",
      createdAt: new Date().toISOString(),
      active: true,
    });
    console.log("[example] insert:", JSON.stringify(ins));

    // Find one
    const one = await (exports as any)["cfx-mongodb"].find("users", { email: "user@example.com" });
    console.log("[example] find:", JSON.stringify(one));

    // Find many with projection/sort/limit/skip
    const many = await (exports as any)["cfx-mongodb"].findAll(
      "users",
      { active: true },
      { projection: { email: 1, createdAt: 1 }, sort: { createdAt: -1 }, limit: 25, skip: 0 }
    );
    console.log("[example] findAll:", JSON.stringify(many));

    // Update
    const upd = await (exports as any)["cfx-mongodb"].update(
      "users",
      { email: "user@example.com" },
      { $set: { active: false } }
    );
    console.log("[example] update:", JSON.stringify(upd));

    // Count
    const cnt = await (exports as any)["cfx-mongodb"].count("users", { active: false });
    console.log("[example] count:", JSON.stringify(cnt));

    // Delete
    const del = await (exports as any)["cfx-mongodb"].delete("users", { email: "user@example.com" });
    console.log("[example] delete:", JSON.stringify(del));

    // Config
    const cfg = await (exports as any)["cfx-mongodb"].config();
    console.log("[example] config:", JSON.stringify(cfg));
  } catch (e) {
    console.error("[example] error:", (e as Error).message);
  }
});

