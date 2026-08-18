import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";

export function MarketingNotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-primary">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        This page does not exist, moved, or is not published yet.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Return to EHS360</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/resources">Explore Resources</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    </Container>
  );
}
