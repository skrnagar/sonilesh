import { Suspense } from "react";
import { OrgAdminWorkspaceLoader } from "@/components/layout/org-admin-workspace-loader";
import { WorkspaceShellFallback } from "@/components/layout/workspace-shell-fallback";

export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <OrgAdminWorkspaceLoader>{children}</OrgAdminWorkspaceLoader>
    </Suspense>
  );
}
