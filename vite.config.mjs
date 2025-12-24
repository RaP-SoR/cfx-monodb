import { defineConfig } from "vite";
import commonjs from "vite-plugin-commonjs";
import { resolve } from "path";

// Workaround für MongoDB- Navigator-Fehler in RedM
const polyfillCode = `
if (typeof global !== "undefined") {
  global.navigator = {
    userAgent: "RedM/Server Node.js Environment",
    platform: process.platform,
    language: "en", 
    languages: ["en"],
    onLine: true,
    product: "Node.js",
    productSub: "",
    vendor: "",
    appName: "Node.js",
    appVersion: process.version
  };
  global.window = { 
    navigator: global.navigator,
    document: {
      createElement: () => ({}),
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { hostname: "localhost", protocol: "https:" }
    },
    location: {
      protocol: "https:",
      hostname: "localhost"
    }
  };
  global.HTMLElement = function() {};
  global.Image = function() {};
  global.XMLHttpRequest = function() {};
  console.log("Browser environment for MongoDB initialized");
}
`;

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
