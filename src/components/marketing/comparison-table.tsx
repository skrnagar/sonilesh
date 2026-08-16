type Row = {
  capability: string;
  team: string;
  business: string;
  enterprise: string;
};

const rows: Row[] = [
  {
    capability: "Core incident & CAPA",
    team: "Included",
    business: "Included",
    enterprise: "Included",
  },
  {
    capability: "Multi-site operations",
    team: "Limited",
    business: "Included",
    enterprise: "Included",
  },
  {
    capability: "Advanced module pack",
    team: "Select",
    business: "Expanded",
    enterprise: "Custom",
  },
  {
    capability: "Entitlement controls",
    team: "Standard",
    business: "Advanced",
    enterprise: "Full admin",
  },
  {
    capability: "Commercial engagement",
    team: "Sales-assisted",
    business: "Sales-assisted",
    enterprise: "Dedicated",
  },
];

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">SONIL EHS360 plan capability comparison</caption>
        <thead className="bg-muted/60">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold text-primary">
              Capability
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-primary">
              Team
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-primary">
              Business
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-primary">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.capability} className="border-t border-border">
              <th scope="row" className="px-4 py-3 font-medium text-foreground">
                {row.capability}
              </th>
              <td className="px-4 py-3 text-muted-foreground">{row.team}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.business}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.enterprise}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
