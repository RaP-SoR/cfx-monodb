const registry = new Map<string, Function>();

export function installExportCapture(): void {
  (globalThis as unknown as { exports: (...args: unknown[]) => void }).exports =
    (name: unknown, fn?: unknown) => {
      if (typeof name === "string" && typeof fn === "function") {
        registry.set(name, fn);
      }
    };
}

export function getExport<T extends (...args: never[]) => unknown>(
  name: string
): T {
  const fn = registry.get(name);
  if (!fn) {
    throw new Error(`Export "${name}" is not registered`);
  }
  return fn as T;
}

export function clearExports(): void {
  registry.clear();
}

export function listExports(): string[] {
  return [...registry.keys()];
}
