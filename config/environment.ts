import "dotenv/config";

const environmentName = process.env.TEST_ENV ?? "local";
const allowedEnvs = ["local", "dev", "stg", "prd"];
const isLocal = environmentName === "local";

if (!allowedEnvs.includes(environmentName)) {
  throw new Error(
    `Invalid TEST_ENV: ${environmentName} specified. Use local, dev, stg or prd`,
  );
}

const uiBaseUrl =
  process.env.UI_BASE_URL ?? (isLocal ? "http://localhost:3001" : "");
const apiBaseUrl =
  process.env.API_BASE_URL ?? (isLocal ? "http://localhost:3001" : "");

if (!uiBaseUrl || !apiBaseUrl) {
  throw new Error(
    "Incorrect test config. UI_BASE_URL and API_BASE_URL are required",
  );
}

export const environmentSpec = {
  name: environmentName,
  uiBaseUrl,
  apiBaseUrl,
  useMocks: (process.env.USE_MOCKS ?? String(isLocal)) === "true",
};
