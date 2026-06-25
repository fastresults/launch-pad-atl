import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { startVersionCheck } from "@/lib/version-check";
import App from "./App";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

// One-shot cleanup: if a previous deploy ever registered a service worker
// (or the browser is holding onto Cache Storage for this origin), it can keep
// serving a stale index.html / stale JS chunks forever. Unregister any SW,
// purge caches, and hard-reload once so the user lands on the fresh build.
async function purgeStaleServiceWorkers() {
  if (typeof window === "undefined") return;
  const FLAG = "sw-purged-v1";
  if (sessionStorage.getItem(FLAG)) return;

  let didCleanup = false;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
        didCleanup = true;
      }
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      if (keys.length > 0) {
        await Promise.all(keys.map((k) => caches.delete(k)));
        didCleanup = true;
      }
    }
  } catch {
    /* ignore */
  }

  sessionStorage.setItem(FLAG, "1");
  if (didCleanup) {
    window.location.reload();
  }
}

void purgeStaleServiceWorkers();

function Root() {
  useEffect(() => {
    return startVersionCheck(() => {
      toast("A new version is available", {
        description: "Refresh to load the latest update.",
        duration: Infinity,
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
