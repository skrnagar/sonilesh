"use client";

import dynamic from "next/dynamic";
import { FieldListSkeleton } from "@/components/field/field-ui";

export const FieldReportsHubLazy = dynamic(
  () => import("@/components/field/field-reports-hub").then((m) => m.FieldReportsHub),
  { loading: () => <FieldListSkeleton rows={8} /> },
);
