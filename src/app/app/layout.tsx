import { Suspense } from "react";
import { headers } from "next/headers";
import { AppWorkspaceLoader } from "@/components/layout/app-workspace-loader";
import { FilesWorkspaceLoader } from "@/components/layout/files-workspace-loader";
import { WorkspaceShellFallback } from "@/components/layout/workspace-shell-fallback";
import { isFilesAppPath } from "@/lib/navigation/app-surfaces";

async function AppShellRouter({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-ehs-pathname") ?? "";
  if (isFilesAppPath(pathname)) {
    return <FilesWorkspaceLoader>{children}</FilesWorkspaceLoader>;
  }
  return <AppWorkspaceLoader>{children}</AppWorkspaceLoader>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <AppShellRouter>{children}</AppShellRouter>
    </Suspense>
  );
}
