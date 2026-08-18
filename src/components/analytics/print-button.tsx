"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button type="button" variant="outline" className="mt-3" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}
