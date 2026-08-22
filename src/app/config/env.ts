export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, ""),
  apiVersion: (import.meta.env.VITE_API_VERSION ?? "v1").trim(),
};
