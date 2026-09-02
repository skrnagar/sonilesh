"use client";

import dynamic from "next/dynamic";
import { FieldListSkeleton } from "@/components/field/field-ui";

export const QualityObservationsPanelLazy = dynamic(
  () =>
    import("@/components/field/quality-observations-panel").then(
      (m) => m.QualityObservationsPanel,
    ),
  { loading: () => <FieldListSkeleton rows={5} /> },
);
