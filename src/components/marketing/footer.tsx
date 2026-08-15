import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { footerColumns } from "@/lib/marketing/nav";
import { brand } from "@/lib/marketing/content";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--mkt-hero)] text-slate-300">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.35fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-sm font-bold text-white">
                E
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                {brand.name}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-300">
              {brand.tagline}
            </p>
            <p className="mt-2 text-sm text-slate-400">{brand.supporting}</p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 EHS360</p>
          <p>Enterprise Environment, Health & Safety platform</p>
        </div>
      </Container>
    </footer>
  );
}
