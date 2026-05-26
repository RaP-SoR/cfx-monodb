import { vi } from "vitest";

vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => defaultValue);
vi.stubGlobal("GetCurrentResourceName", () => "cfx-mongodb");
vi.stubGlobal(
  "GetResourceMetadata",
  (_resource: string, key: string, _index: number) =>
    key === "version" ? "1.0.0" : ""
);
vi.stubGlobal("emitNet", vi.fn());
vi.stubGlobal("TriggerEvent", vi.fn());
vi.stubGlobal("on", vi.fn());
