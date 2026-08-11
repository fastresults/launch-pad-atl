import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminCommandMenu } from "@/components/admin/AdminCommandMenu";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";



export default function AdminLayout() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <ThemeProvider forced="light">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <ImpersonationBanner />
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AdminBreadcrumb />
            <div className="ml-auto flex items-center gap-2">
              <AdminCommandMenu />
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-x-auto p-6">
            <AdminErrorBoundary>
              <Outlet />
            </AdminErrorBoundary>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
