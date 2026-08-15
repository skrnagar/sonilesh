import Link from "next/link";

const links = [
  { href: "/field/report/incident", label: "Incident" },
  { href: "/field/report/near-miss", label: "Near miss" },
  { href: "/field/report/hazard", label: "Hazard" },
];

export default function FieldReportIndex() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Quick report</h1>
      <p className="text-sm text-slate-400">Minimal typing. Camera, GPS, draft or submit.</p>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="block rounded-xl bg-teal-500 px-4 py-4 text-center text-sm font-bold text-slate-950"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
