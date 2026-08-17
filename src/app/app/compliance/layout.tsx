import { ComplianceSubnav } from "@/components/compliance/compliance-subnav";

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <ComplianceSubnav />
      {children}
    </div>
  );
}
