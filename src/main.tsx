import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import {
  APP_VERSION,
  replaceStaleBuild,
  startVersionCheck,
} from "@/lib/version-check";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import App from "./App";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

function Root() {
  useEffect(() => {
    document.documentElement.dataset.appVersion = APP_VERSION;

    return startVersionCheck((version) => {
      if (replaceStaleBuild(version)) return;

      toast("A new version is available", {
        description: "Refresh once to load the latest update.",
        duration: Infinity,
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
    });
  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
