import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Container } from "@/components/marketing/container";
import { footerColumns } from "@/lib/marketing/nav";
import { brand, company } from "@/lib/marketing/content";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--mkt-hero)] text-white/75">
      <Container className="py-16 md:py-20">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))] md:gap-10">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex">
              <BrandLockup inverse />
            </Link>
            <p className="mt-5 text-sm font-medium leading-relaxed text-white/85">
              {brand.tagline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {brand.supporting}
            </p>
            <p className="mt-4 text-xs leading-relaxed text-white/45">
              {company.legalEntity}
              <br />
              {company.hq} {company.pin}
              <br />
              <a className="text-white/70 hover:text-white" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              {" · "}
              <a className="text-white/70 hover:text-white" href={`tel:${company.phone.replace(/\s/g, "")}`}>
                {company.phone}
              </a>
            </p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-white/75 transition-colors hover:text-white motion-reduce:transition-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {brand.legalName}</p>
          <p>Multi-tenant Environment, Health & Safety SaaS</p>
        </div>
      </Container>
    </footer>
  );
}
