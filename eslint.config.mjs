import pluginTs from "@typescript-eslint/eslint-plugin";
import parserTs from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "**/*.d.ts"],
  },
  {
    files: ["src/**/*.ts"],
    plugins: { "@typescript-eslint": pluginTs },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: parserTs,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
    },
  },
];
