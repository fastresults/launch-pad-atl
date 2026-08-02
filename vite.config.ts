import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

function sourceReleaseId(): string {
  const hash = createHash("sha256");
  const roots = ["src", "index.html", "package.json", "vite.config.ts"];

  const addPath = (path: string) => {
    const absolute = resolve(path);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absolute).sort()) addPath(`${path}/${entry}`);
      return;
    }
    hash.update(path);
    hash.update(readFileSync(absolute));
  };

  for (const root of roots) addPath(root);
  return hash.digest("hex").slice(0, 16);
}

const RELEASE_ID = sourceReleaseId();
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    {
      name: "inject-app-version",
      transformIndexHtml(html) {
        return html.replace(
          "</head>",
          `  <meta name="app-release" content="${RELEASE_ID}" />\n</head>`,
        );
      },
    },
  ],
  define: {
    __RELEASE_ID__: JSON.stringify(RELEASE_ID),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL ?? "https://hflfxytqrlkobhuugsca.supabase.co",
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_r946rKTCDJS2VltQRFvPKQ_HdMnggYa",
    ),
  },
});
