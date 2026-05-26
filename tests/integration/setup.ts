export const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI ?? "";
export const skipIntegration = !TEST_MONGODB_URI;

if (skipIntegration) {
  console.warn(
    "[integration] TEST_MONGODB_URI unset — integration tests will be skipped. " +
      "Set e.g. mongodb://127.0.0.1:27017/cfx_mongodb_test for local runs."
  );
}

export const TEST_DB_OPTIONS = {
  serverSelectionTimeoutMS: 3000,
} as const;
