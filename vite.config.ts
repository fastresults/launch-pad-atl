import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tsConfigPaths(), tailwindcss()],
  },
  routers: {
    server: {
      entry: "./src/server.ts",
    },
  },
});
