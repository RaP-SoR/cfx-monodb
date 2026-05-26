import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearExports, getExport, installExportCapture } from "../helpers/export-registry";
import { registerExports } from "../../src/exports";
import { createMockConnector } from "../helpers/mock-db";

const connectorMock = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getDb: vi.fn(),
  isDbConnected: vi.fn(),
  getInstance: vi.fn(),
}));

vi.mock("../../src/connector", () => ({
  default: connectorMock,
}));

function registerLifecycleExports(connected = true) {
  connectorMock.getInstance.mockReturnValue(connectorMock);
  connectorMock.isDbConnected.mockReturnValue(connected);
  connectorMock.getDb.mockReturnValue(connected ? { databaseName: "test" } : null);

  clearExports();
  installExportCapture();
  registerExports(createMockConnector(null, connected));
}

describe("lifecycle handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectorMock.getInstance.mockReturnValue(connectorMock);
  });

  describe("connect", () => {
    it("connects and emits cfx-mongodb:connected on success", async () => {
      connectorMock.connect.mockResolvedValue(undefined);
      registerLifecycleExports(false);

      const connect = getExport<
        (url: string, options?: object) => Promise<void>
      >("connect");

      await connect("mongodb://127.0.0.1:27017/test");

      expect(connectorMock.connect).toHaveBeenCalledWith(
        "mongodb://127.0.0.1:27017/test",
        undefined
      );
      expect(globalThis.TriggerEvent).toHaveBeenCalledWith(
        "cfx-mongodb:connected",
        true
      );
    });

    it("emits failure event when connect throws", async () => {
      connectorMock.connect.mockRejectedValue(new Error("auth failed"));
      registerLifecycleExports(false);

      const connect = getExport<
        (url: string) => Promise<void>
      >("connect");

      await connect("mongodb://bad:creds@127.0.0.1:27017/test");

      expect(globalThis.TriggerEvent).toHaveBeenCalledWith(
        "cfx-mongodb:connected",
        false,
        "auth failed"
      );
    });
  });

  describe("disconnect", () => {
    it("disconnects and emits cfx-mongodb:disconnected on success", async () => {
      connectorMock.disconnect.mockResolvedValue(undefined);
      registerLifecycleExports(true);

      const disconnect = getExport<() => Promise<void>>("disconnect");

      await disconnect();

      expect(connectorMock.disconnect).toHaveBeenCalled();
      expect(globalThis.TriggerEvent).toHaveBeenCalledWith(
        "cfx-mongodb:disconnected",
        true
      );
    });

    it("emits failure event when disconnect throws", async () => {
      connectorMock.disconnect.mockRejectedValue(new Error("close failed"));
      registerLifecycleExports(true);

      const disconnect = getExport<() => Promise<void>>("disconnect");

      await disconnect();

      expect(globalThis.TriggerEvent).toHaveBeenCalledWith(
        "cfx-mongodb:disconnected",
        false,
        "close failed"
      );
    });
  });

  describe("isConnected", () => {
    it("returns false when provider reports disconnected", () => {
      registerLifecycleExports(false);

      const isConnected = getExport<() => boolean>("isConnected");

      expect(isConnected()).toBe(false);
    });
  });
});
