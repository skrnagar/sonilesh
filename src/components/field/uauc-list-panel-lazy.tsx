"use client";

import dynamic from "next/dynamic";
import { FieldListSkeleton } from "@/components/field/field-ui";

export const UaucListPanelLazy = dynamic(
  () => import("@/components/field/uauc-list-panel").then((m) => m.UaucListPanel),
  { loading: () => <FieldListSkeleton rows={5} /> },
);
