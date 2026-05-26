import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const connectorMock = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getDb: vi.fn(),
  isDbConnected: vi.fn(),
  getInstance: vi.fn(),
}));

const registerExportsMock = vi.hoisted(() => vi.fn());
const ensureIndexesFromConvarMock = vi.hoisted(() => vi.fn());

vi.mock("../src/connector", () => ({
  default: connectorMock,
}));

vi.mock("../src/exports", () => ({
  registerExports: registerExportsMock,
}));

vi.mock("../src/services/indexService", () => ({
  ensureIndexesFromConvar: ensureIndexesFromConvarMock,
}));

type ResourceHandler = (resourceName: string) => Promise<void>;

let onResourceStart: ResourceHandler;
let onResourceStop: ResourceHandler;

describe("bootstrap", () => {
  beforeAll(async () => {
    connectorMock.getInstance.mockReturnValue(connectorMock);
    await import("../src/bootstrap");

    const onMock = globalThis.on as ReturnType<typeof vi.fn>;
    onResourceStart = onMock.mock.calls.find(
      ([event]) => event === "onResourceStart"
    )?.[1] as ResourceHandler;
    onResourceStop = onMock.mock.calls.find(
      ([event]) => event === "onResourceStop"
    )?.[1] as ResourceHandler;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    connectorMock.getInstance.mockReturnValue(connectorMock);
    connectorMock.connect.mockResolvedValue(undefined);
    connectorMock.disconnect.mockResolvedValue(undefined);
    connectorMock.isDbConnected.mockReturnValue(true);
    connectorMock.getDb.mockReturnValue({ databaseName: "test" });
    ensureIndexesFromConvarMock.mockResolvedValue(undefined);
  });

  it("registers onResourceStart and onResourceStop handlers", () => {
    expect(onResourceStart).toEqual(expect.any(Function));
    expect(onResourceStop).toEqual(expect.any(Function));
  });

  it("connects, registers exports, ensures indexes, and emits ready", async () => {
    await onResourceStart("cfx-mongodb");

    expect(connectorMock.connect).toHaveBeenCalled();
    expect(registerExportsMock).toHaveBeenCalledWith(connectorMock);
    expect(ensureIndexesFromConvarMock).toHaveBeenCalled();
    expect(globalThis.TriggerEvent).toHaveBeenCalledWith("cfx-mongodb:ready");
  });

  it("ignores onResourceStart for other resources", async () => {
    await onResourceStart("other-resource");

    expect(connectorMock.connect).not.toHaveBeenCalled();
    expect(registerExportsMock).not.toHaveBeenCalled();
    expect(globalThis.TriggerEvent).not.toHaveBeenCalledWith(
      "cfx-mongodb:ready"
    );
  });

  it("does not emit ready when connect fails", async () => {
    connectorMock.connect.mockRejectedValueOnce(new Error("connect failed"));

    await onResourceStart("cfx-mongodb");

    expect(registerExportsMock).not.toHaveBeenCalled();
    expect(globalThis.TriggerEvent).not.toHaveBeenCalledWith(
      "cfx-mongodb:ready"
    );
  });

  it("disconnects on resource stop", async () => {
    await onResourceStop("cfx-mongodb");

    expect(connectorMock.disconnect).toHaveBeenCalled();
  });

  it("ignores onResourceStop for other resources", async () => {
    await onResourceStop("other-resource");

    expect(connectorMock.disconnect).not.toHaveBeenCalled();
  });
});
