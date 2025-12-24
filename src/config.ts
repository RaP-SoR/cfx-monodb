interface DatabaseConfig {
  mongoUrl: string;
  options: {
    serverSelectionTimeoutMS: number;
    maxPoolSize?: number;
    minPoolSize?: number;
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
      "mongodb://localhost:27017/ctf_dev"
    ),
    options: {
      serverSelectionTimeoutMS: parseInt(GetConvar("mongodb_timeout", "5000")),
      maxPoolSize: 10,
      minPoolSize: 0,
    },
  },
  prod: {
    mongoUrl: GetConvar(
      "mongodb_prod_url",
      "mongodb://localhost:27017/ctf_prod"
    ),
    options: {
      serverSelectionTimeoutMS: parseInt(GetConvar("mongodb_timeout", "10000")),
      maxPoolSize: 10,
      minPoolSize: 0,
    },
  },
  test: {
    mongoUrl: GetConvar(
      "mongodb_test_url",
      "mongodb://localhost:27017/ctf_test"
    ),
    options: {
      serverSelectionTimeoutMS: parseInt(GetConvar("mongodb_timeout", "2000")),
      maxPoolSize: 5,
      minPoolSize: 0,
    },
  },
};

const environment = GetConvar(
  "mongodb_env",
  isDevelopmentServer() ? "dev" : "prod"
) as "dev" | "prod" | "test";

console.log(`[CFX-MongoDB] Environment: ${environment}`);

export default config[environment];
