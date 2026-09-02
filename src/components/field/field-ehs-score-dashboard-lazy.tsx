"use client";

import dynamic from "next/dynamic";
import { FieldListSkeleton } from "@/components/field/field-ui";

export const FieldEhsScoreDashboardLazy = dynamic(
  () =>
    import("@/components/field/field-ehs-score-dashboard").then(
      (m) => m.FieldEhsScoreDashboard,
    ),
  { loading: () => <FieldListSkeleton rows={6} /> },
);
