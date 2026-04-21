import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Default jsdom — gives tests localStorage + document for free. Per-file
    // override via `@vitest-environment node` docblock if a test needs it
    // (pure utils are faster in node).
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
