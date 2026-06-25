import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const APP_VERSION = new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    {
      name: "inject-app-version",
      transformIndexHtml(html) {
        return html.replace(/__APP_VERSION__/g, APP_VERSION);
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL ?? "https://hflfxytqrlkobhuugsca.supabase.co",
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_r946rKTCDJS2VltQRFvPKQ_HdMnggYa",
    ),
  },
});
