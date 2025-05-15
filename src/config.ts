interface DatabaseConfig {
  mongoUrl: string;
  options: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
    serverSelectionTimeoutMS: number;
  };
}

interface Config {
  dev: DatabaseConfig;
  prod: DatabaseConfig;
  test: DatabaseConfig;
}

const isDevelopmentServer = (): boolean => {
  const serverName = GetConvar("sv_hostname", "").toLowerCase();
  return (
    serverName.includes("dev") ||
    serverName.includes("test") ||
    serverName.includes("local")
  );
};

const config: Config = {
  dev: {
    mongoUrl: GetConvar(
      "mongodb_dev_url",
      "mongodb://localhost:27017/redm_dev"
    ),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: parseInt(GetConvar("mongodb_timeout", "5000")),
    },
  },
  prod: {
    mongoUrl: GetConvar(
      "mongodb_prod_url",
      "mongodb://localhost:27017/redm_prod"
    ),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: parseInt(GetConvar("mongodb_timeout", "10000")),
    },
  },
  test: {
    mongoUrl: GetConvar(
      "mongodb_test_url",
      "mongodb://localhost:27017/redm_test"
    ),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: parseInt(GetConvar("mongodb_timeout", "2000")),
    },
  },
};

const environment = GetConvar(
  "mongodb_env",
  isDevelopmentServer() ? "dev" : "prod"
) as "dev" | "prod" | "test";

console.log(`[CFX-MongoDB] Environment: ${environment}`);

export default config[environment];
