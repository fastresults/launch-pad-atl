import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { RELEASE_ID, replaceStaleBuild, startVersionCheck } from "@/lib/version-check";
import { startRenderDiagnostics } from "@/lib/render-diagnostics";
import { startViewportLogging } from "@/lib/viewport-log";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import App from "./App";
import "./styles.css";
import "./public.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

function Root() {
  useEffect(() => {
    document.documentElement.dataset.appRelease = RELEASE_ID;

    const recordCssBundle = () => {
      const stylesheet = [...document.styleSheets]
        .map((sheet) => sheet.href)
        .find((href) => href?.includes("/assets/") && href.endsWith(".css"));
      document.documentElement.dataset.cssBundle = stylesheet?.split("/").pop() ?? "development";
    };
    recordCssBundle();
    const stopDiagnostics = startRenderDiagnostics();

    const stopVersionCheck = startVersionCheck((version) => {
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

    return () => {
      stopDiagnostics();
      stopVersionCheck();
    };
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
