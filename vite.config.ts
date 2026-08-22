import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = (environment.VITE_API_BASE_URL ?? "").trim();
  const apiVersion = (environment.VITE_API_VERSION ?? "").trim();

  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is required.");
  }

  if (!/^v\d+$/i.test(apiVersion)) {
    throw new Error(
      "VITE_API_VERSION is required and must use the form v<number> (for example v1).",
    );
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
