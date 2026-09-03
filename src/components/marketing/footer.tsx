import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Container } from "@/components/marketing/container";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { footerColumns } from "@/lib/marketing/nav";
import { brand, company } from "@/lib/marketing/content";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--mkt-hero)] text-white/75">
      <Container className="py-16 md:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))] lg:gap-8">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex">
              <BrandLockup inverse />
            </Link>
            <p className="mt-5 font-display text-lg font-semibold tracking-tight text-white">
              {brand.name}
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-white/88">
              {brand.tagline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/58">
              {brand.supporting}
            </p>
            <p className="mt-5 text-xs leading-relaxed text-white/45">
              {company.legalEntity}
              <br />
              {company.hq} {company.pin}
              <br />
              <a className="text-white/70 transition-colors hover:text-white" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              {" · "}
              <a className="text-white/70 transition-colors hover:text-white" href={`tel:${company.phone.replace(/\s/g, "")}`}>
                {company.phone}
              </a>
            </p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="mkt-eyebrow text-white/42">{column.title}</p>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center text-sm text-white/72 transition-colors hover:text-white motion-reduce:transition-none"
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/42 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {brand.legalName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <p>SONIL EHS360 · Field · My Zone · Workspace · Org Admin · India-first</p>
            <div className="flex items-center gap-2">
              <span className="mkt-eyebrow text-white/38">Theme</span>
              <ThemeToggle
                compact
                className="border-white/20 bg-white/10 text-white shadow-none hover:bg-white/15 hover:text-white focus-visible:ring-white/50"
              />
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
