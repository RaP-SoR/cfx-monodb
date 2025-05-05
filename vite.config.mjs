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
  build: {
    target: "node16",
    outDir: "dist",
    minify: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["cjs"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["crypto", "fs", "path", "os", "util", "stream", "events"],
      output: {
        format: "cjs",
        intro: polyfillCode, // Injiziert den Polyfill-Code vor allem anderen
      },
    },
    ssr: true,
  },
});
