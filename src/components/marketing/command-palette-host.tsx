"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { MKT_COMMAND_EVENT } from "@/lib/marketing/command-events";

const CommandPalette = dynamic(
  () => import("@/components/marketing/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function CommandPaletteHost() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    function arm(nextOpen = true) {
      setMounted(true);
      setOpen(nextOpen);
    }
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        arm(!openRef.current);
      }
    }
    function onCustom() {
      arm(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(MKT_COMMAND_EVENT, onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(MKT_COMMAND_EVENT, onCustom);
    };
  }, []);

  if (!mounted) return null;
  return <CommandPalette open={open} onOpenChange={setOpen} />;
}
