"use client";

import Link from "next/link";
import { useState } from "react";
import type { StructureNode } from "@/lib/services/hierarchy";
import { cn } from "@/lib/utils";

const KIND_HREF: Record<StructureNode["kind"], string | null> = {
  organization: "/app/settings/organization",
  business_unit: "/app/settings/business-units",
  region: "/app/settings/regions",
  site: "/app/settings/sites",
  project: "/app/settings/projects",
  department: "/app/settings/departments",
  location: "/app/settings/locations",
};

export function StructureTree({ root }: { root: StructureNode }) {
  return (
    <ul className="space-y-1 font-mono text-sm text-foreground">
      <TreeNode node={root} depth={0} defaultOpen />
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  defaultOpen = false,
}: {
  node: StructureNode;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth < 2);
  const hasChildren = node.children.length > 0;
  const href = KIND_HREF[node.kind];

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
        style={{ paddingLeft: `${depth * 1.1 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-border text-xs"
          >
            {open ? "−" : "+"}
          </button>
        ) : (
          <span className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground">
            ·
          </span>
        )}
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {node.kind.replace("_", " ")}
        </span>
        {href ? (
          <Link href={`${href}?highlight=${node.id}`} className="font-sans font-medium hover:underline">
            {node.label}
          </Link>
        ) : (
          <span className="font-sans font-medium">{node.label}</span>
        )}
        {node.meta ? (
          <span className="font-sans text-xs text-muted-foreground">{node.meta}</span>
        ) : null}
      </div>
      {hasChildren && open ? (
        <ul className={cn("border-l border-border/70 ml-5")}>
          {node.children.map((child) => (
            <TreeNode key={`${child.kind}-${child.id}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
