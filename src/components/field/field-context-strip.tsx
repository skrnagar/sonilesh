import { FIELD_ROLE_LABELS, resolveAccessAtLevel } from "@/lib/field/report-links";
import type { FieldRole } from "@/lib/auth/field-roles";

type Props = {
  userName: string;
  businessUnitName: string;
  regionName: string;
  projectName: string;
  role: FieldRole;
  projectId: string | null;
  siteId: string | null;
  regionId: string | null;
  businessUnitId: string | null;
};

export function FieldContextStrip({
  userName,
  businessUnitName,
  regionName,
  projectName,
  role,
  projectId,
  siteId,
  regionId,
  businessUnitId,
}: Props) {
  const accessAt = resolveAccessAtLevel({ projectId, siteId, regionId, businessUnitId });

  const cells = [
    { label: "User Name", value: userName },
    { label: "Business Unit", value: businessUnitName },
    { label: "Region", value: regionName },
    { label: "Project", value: projectName },
    { label: "Role", value: FIELD_ROLE_LABELS[role] },
    { label: "Access At", value: accessAt },
  ];

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-card shadow-[var(--shadow-sm)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {cells.map((cell) => (
              <th
                key={cell.label}
                className="px-3 py-2 text-xs font-semibold text-[var(--raksha-blue-dark)]"
              >
                {cell.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cells.map((cell) => (
              <td key={cell.label} className="px-3 py-2.5 text-foreground">
                {cell.value || "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
