"use client";

import dynamic from "next/dynamic";
import { FieldListSkeleton } from "@/components/field/field-ui";

export const InspectionRunnerLazy = dynamic(
  () => import("@/components/field/inspection-runner").then((m) => m.InspectionRunner),
  { loading: () => <FieldListSkeleton rows={4} /> },
);
