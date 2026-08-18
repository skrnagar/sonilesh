import { MarketingNotFound } from "@/components/marketing/not-found-content";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="flex flex-1">
        <MarketingNotFound />
      </main>
    </div>
  );
}
