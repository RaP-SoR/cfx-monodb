import { describe, expect, it, vi } from "vitest";

describe("bootstrap", () => {
  it("registers onResourceStart and onResourceStop handlers", async () => {
    const onMock = globalThis.on as ReturnType<typeof vi.fn>;
    onMock.mockClear();

    await import("../src/bootstrap");

    expect(onMock).toHaveBeenCalledWith(
      "onResourceStart",
      expect.any(Function)
    );
    expect(onMock).toHaveBeenCalledWith(
      "onResourceStop",
      expect.any(Function)
    );
  });
});
