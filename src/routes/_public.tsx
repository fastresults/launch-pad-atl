import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

/**
 * Marketing/public shell. Unlike Admin and Dashboard (pinned light), visitors
 * pick their own surface here; the choice is remembered under `site-theme`.
 */
export default function PublicLayout() {
  return (
    <ThemeProvider storageKey="site-theme">
      <Outlet />
    </ThemeProvider>
  );
}
