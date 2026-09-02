"use client";

import dynamic from "next/dynamic";
import { FieldListSkeleton } from "@/components/field/field-ui";

export const FieldAllocatedActionListLazy = dynamic(
  () =>
    import("@/components/field/field-allocated-action-list").then(
      (m) => m.FieldAllocatedActionList,
    ),
  { loading: () => <FieldListSkeleton rows={6} /> },
);
