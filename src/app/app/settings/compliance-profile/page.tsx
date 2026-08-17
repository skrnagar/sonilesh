import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import {
  addObligationAction,
  excludeObligationAction,
  reevaluateApplicabilityAction,
  saveComplianceProfileAction,
} from "@/app/actions/compliance";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { INDUSTRIES } from "@/lib/constants/industries";
import {
  EMPLOYEE_BANDS,
  NET_PROFIT_BANDS,
  NET_WORTH_BANDS,
  TURNOVER_BANDS,
  WASTE_STREAMS,
} from "@/lib/compliance/applicability";
import { listApplicableWithWhy } from "@/lib/services/compliance";

const BAND_LABELS: Record<string, string> = {
  under_50cr: "Under ₹50Cr",
  "50_250cr": "₹50–250Cr",
  "250_500cr": "₹250–500Cr",
  "500cr_plus": "₹500Cr+",
  under_5cr: "Under ₹5Cr",
  "5_50cr": "₹5–50Cr",
  "50cr_plus": "₹50Cr+",
  "1_50": "1–50",
  "51_250": "51–250",
  "251_1000": "251–1,000",
  "1000_plus": "1,000+",
};

export default async function ComplianceProfilePage() {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.manage",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: profile }, checklist, { data: library }] = await Promise.all([
    access.supabase
      .from("org_compliance_profile")
      .select("*")
      .eq("organization_id", access.organization.id)
      .maybeSingle(),
    listApplicableWithWhy(access.supabase, access.organization.id),
    access.supabase.from("compliance_obligations").select("id, code, title").eq("is_active", true).order("title"),
  ]);

  const waste = new Set((profile?.waste_streams_generated as string[] | undefined) ?? []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Compliance profile</h1>
        <p className="text-sm text-muted-foreground">
          Applicability is evaluated against this profile using configured JSON rules (country, industry,
          site type, listings, waste streams, size bands). This is not legal advice and does not decide
          statutory applicability without those rules.
        </p>
      </div>

      <ActionForm
        action={saveComplianceProfileAction}
        className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="industrySector">Industry / sector</Label>
            <Select id="industrySector" name="industrySector" defaultValue={profile?.industry_sector ?? access.organization.industry ?? ""}>
              <option value="">Select</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subSectors">Sub-sectors (comma separated)</Label>
            <Input id="subSectors" name="subSectors" defaultValue={(profile?.sub_sectors ?? []).join(", ")} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="isListed" defaultChecked={Boolean(profile?.is_listed)} />
            Listed entity
          </label>
          <div className="space-y-2">
            <Label htmlFor="marketCapRank">Market-cap rank (if listed)</Label>
            <Input
              id="marketCapRank"
              name="marketCapRank"
              type="number"
              defaultValue={profile?.market_cap_rank ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="turnoverBand">Turnover band</Label>
            <Select id="turnoverBand" name="turnoverBand" defaultValue={profile?.turnover_band ?? ""}>
              <option value="">Select</option>
              {TURNOVER_BANDS.map((b) => (
                <option key={b} value={b}>
                  {BAND_LABELS[b]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="netWorthBand">Net worth band</Label>
            <Select id="netWorthBand" name="netWorthBand" defaultValue={profile?.net_worth_band ?? ""}>
              <option value="">Select</option>
              {NET_WORTH_BANDS.map((b) => (
                <option key={b} value={b}>
                  {BAND_LABELS[b]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="netProfitBand">Net profit band</Label>
            <Select id="netProfitBand" name="netProfitBand" defaultValue={profile?.net_profit_band ?? ""}>
              <option value="">Select</option>
              {NET_PROFIT_BANDS.map((b) => (
                <option key={b} value={b}>
                  {BAND_LABELS[b]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeBand">Employee count band</Label>
            <Select id="employeeBand" name="employeeBand" defaultValue={profile?.employee_count_band ?? ""}>
              <option value="">Select</option>
              {EMPLOYEE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {BAND_LABELS[b]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="states">States of operation (comma separated)</Label>
            <Input id="states" name="states" defaultValue={(profile?.states_of_operation ?? []).join(", ")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="countryCode">Country code (ISO)</Label>
            <Input id="countryCode" name="countryCode" defaultValue={profile?.country_code ?? ""} placeholder="IN" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jurisdictionCodes">Jurisdiction codes (comma separated)</Label>
            <Input
              id="jurisdictionCodes"
              name="jurisdictionCodes"
              defaultValue={(profile?.jurisdiction_codes ?? []).join(", ")}
              placeholder="IN, IN-MH"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="siteTypes">Typical site types (comma separated)</Label>
            <Input
              id="siteTypes"
              name="siteTypes"
              defaultValue={(profile?.site_types ?? []).join(", ")}
              placeholder="permanent, temporary_project"
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              name="autoNoncompliant"
              defaultChecked={Boolean(profile?.auto_noncompliant_on_expired_evidence)}
            />
            Auto-mark obligations non-compliant when evidence expires (off by default — expiry is flagged, not a legal finding)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="exportsToEu" defaultChecked={Boolean(profile?.exports_to_eu)} />
            Exports to the EU (CBAM)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="cctsSector" defaultChecked={Boolean(profile?.ccts_sector)} />
            CCTS-notified sector (aluminium, cement, chlor-alkali, pulp & paper, petroleum refining,
            petrochemicals, textiles)
          </label>
          <fieldset className="md:col-span-2 space-y-2">
            <legend className="text-sm font-medium">Waste streams generated</legend>
            <div className="flex flex-wrap gap-3">
              {WASTE_STREAMS.map((stream) => (
                <label key={stream} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`waste_${stream}`} defaultChecked={waste.has(stream)} />
                  {stream}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <Button type="submit">Save profile and evaluate applicability</Button>
      </ActionForm>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Applicable obligations</h2>
        <ActionForm action={reevaluateApplicabilityAction}>
          <Button type="submit" variant="outline">
            Re-run engine
          </Button>
        </ActionForm>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Obligation</th>
              <th className="px-3 py-2 text-left">Domain</th>
              <th className="px-3 py-2 text-left">Why this applies</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Override</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((row) => {
              const ob = row.compliance_obligations as {
                title?: string;
                code?: string;
                compliance_domains?: { name?: string } | null;
              } | null;
              const why = Array.isArray(row.matched_rules)
                ? (row.matched_rules as Array<{ reason?: string }>)
                    .map((m) => m.reason)
                    .join(" ")
                : "";
              return (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">
                    <div className="font-medium">{ob?.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">{ob?.code}</div>
                  </td>
                  <td className="px-3 py-2">{ob?.compliance_domains?.name}</td>
                  <td className="px-3 py-2 text-muted-foreground" title={why}>
                    {why || "—"}
                    {row.justification_note ? (
                      <p className="mt-1 text-xs">Override note: {row.justification_note}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {row.applicability_status} / {row.status}
                  </td>
                  <td className="px-3 py-2">
                    {row.applicability_status !== "manually_excluded" ? (
                      <ActionForm action={excludeObligationAction} className="space-y-2">
                        <input type="hidden" name="applicableId" value={row.id} />
                        <Input name="justification" placeholder="Justification (required)" required minLength={8} />
                        <Button type="submit" variant="outline" size="sm">
                          Exclude
                        </Button>
                      </ActionForm>
                    ) : (
                      <span className="text-xs">Excluded</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="max-w-xl space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold">Manually add an obligation</h3>
        <ActionForm action={addObligationAction} className="space-y-3">
          <Select name="obligationId" required>
            <option value="">Select from library</option>
            {(library ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.title} ({row.code})
              </option>
            ))}
          </Select>
          <Input name="justification" placeholder="Why this applies despite the rules" required minLength={8} />
          <Button type="submit">Add</Button>
        </ActionForm>
      </div>
    </div>
  );
}
