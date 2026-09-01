import { Suspense } from "react";
import { AppWorkspaceLoader } from "@/components/layout/app-workspace-loader";
import { WorkspaceShellFallback } from "@/components/layout/workspace-shell-fallback";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <AppWorkspaceLoader>{children}</AppWorkspaceLoader>
    </Suspense>
  );
}
