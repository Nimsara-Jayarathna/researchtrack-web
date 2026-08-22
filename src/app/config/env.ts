function requireEnv(name: string, value: string | undefined): string {
  const normalized = (value ?? "").trim();

  if (!normalized) {
    throw new Error(`${name} is required.`);
  }

  return normalized;
}

const apiBaseUrl = requireEnv(
  "VITE_API_BASE_URL",
  import.meta.env.VITE_API_BASE_URL,
).replace(/\/+$/, "");

const apiVersion = requireEnv(
  "VITE_API_VERSION",
  import.meta.env.VITE_API_VERSION,
).replace(/^\/+|\/+$/g, "");

if (!/^v\d+$/i.test(apiVersion)) {
  throw new Error(
    `VITE_API_VERSION must use the form v<number> (for example v1). Received: ${apiVersion}`,
  );
}

export const env = Object.freeze({
  apiBaseUrl,
  apiVersion,
});
