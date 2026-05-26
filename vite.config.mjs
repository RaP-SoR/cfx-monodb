import { defineConfig } from "vite";
import commonjs from "vite-plugin-commonjs";
import { resolve } from "path";

// MongoDB driver browser checks are stubbed via `define` below (not runtime polyfills).
// A previous polyfillCode block was never injected into the bundle; SSR `define` is sufficient.

export default defineConfig({
  plugins: [commonjs()],
  resolve: {
    browserField: false,
    mainFields: ["module", "main"],
  },
  define: {
    "global.navigator": "undefined",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
  },
  build: {
    target: "node22",
    ssr: true,
    outDir: "dist",
    minify: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["cjs"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "mongodb",
        "@citizenfx/server",
        "@citizenfx/client",
        "crypto",
        "fs",
        "path",
        "os",
        "util",
        "stream",
        "events",
      ],
      output: {
        format: "cjs",
        exports: "named",
      },
    },
    emptyOutDir: false,
  },
});
