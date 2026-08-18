"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  EMPLOYEE_BANDS,
  NET_WORTH_BANDS,
  SAMPLE_OBLIGATIONS,
  TURNOVER_BANDS,
  WASTE_STREAMS,
  evaluateObligationRules,
  type EmployeeBand,
  type NetWorthBand,
  type OrgComplianceProfileInput,
  type TurnoverBand,
  type WasteStream,
} from "@/lib/compliance/applicability";
import { BRSR_REVEAL_COPY, brsrRevealKind, formatBrsrShareText } from "@/lib/marketing/brsr-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TURNOVER_LABEL: Record<TurnoverBand, string> = {
  under_50cr: "Under ₹50Cr",
  "50_250cr": "₹50–250Cr",
  "250_500cr": "₹250–500Cr",
  "500cr_plus": "₹500Cr+",
};

const NET_WORTH_LABEL: Record<NetWorthBand, string> = {
  under_50cr: "Under ₹50Cr",
  "50_250cr": "₹50–250Cr",
  "250_500cr": "₹250–500Cr",
  "500cr_plus": "₹500Cr+",
};

const EMPLOYEE_LABEL: Record<EmployeeBand, string> = {
  "1_50": "1–50",
  "51_250": "51–250",
  "251_1000": "251–1000",
  "1000_plus": "1000+",
};

const WASTE_LABEL: Record<WasteStream, string> = {
  plastic: "Plastic",
  "e-waste": "E-waste",
  battery: "Battery",
  hazardous: "Hazardous",
  c_and_d: "C&D",
  elv: "ELV",
};

const SECTORS = [
  "Manufacturing",
  "Construction",
  "EPC",
  "Infrastructure",
  "Mining",
  "Oil & gas",
  "Renewable energy",
  "Logistics",
  "Other",
];

const selectClass =
  "flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

type StepId =
  | "listed"
  | "rank"
  | "sector"
  | "employees"
  | "turnover"
  | "netWorth"
  | "waste"
  | "eu"
  | "ccts";

function stepsFor(listed: boolean): StepId[] {
  return listed
    ? ["listed", "rank", "sector", "employees", "turnover", "netWorth", "waste", "eu", "ccts"]
    : ["listed", "sector", "employees", "turnover", "netWorth", "waste", "eu", "ccts"];
}

export function BrsrApplicabilityForm() {
  const [isListed, setIsListed] = useState(false);
  const [marketCapRank, setMarketCapRank] = useState("");
  const [sector, setSector] = useState("Manufacturing");
  const [employees, setEmployees] = useState<EmployeeBand>("51_250");
  const [turnover, setTurnover] = useState<TurnoverBand>("50_250cr");
  const [netWorth, setNetWorth] = useState<NetWorthBand>("50_250cr");
  const [waste, setWaste] = useState<WasteStream[]>([]);
  const [exportsToEu, setExportsToEu] = useState(false);
  const [ccts, setCcts] = useState(false);
  const [ran, setRan] = useState(false);
  const [rankError, setRankError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const steps = stepsFor(isListed);
  const step = steps[Math.min(stepIndex, steps.length - 1)]!;
  const isLast = stepIndex >= steps.length - 1;

  const profile: OrgComplianceProfileInput = useMemo(
    () => ({
      industry_sector: sector,
      is_listed: isListed,
      market_cap_rank: marketCapRank ? Number(marketCapRank) : null,
      turnover_band: turnover,
      net_worth_band: netWorth,
      employee_count_band: employees,
      exports_to_eu: exportsToEu,
      waste_streams_generated: waste,
      ccts_sector: ccts,
    }),
    [ccts, employees, exportsToEu, isListed, marketCapRank, netWorth, sector, turnover, waste],
  );

  const results = useMemo(
    () =>
      SAMPLE_OBLIGATIONS.map((row) => ({
        ...row,
        ...evaluateObligationRules(row.rules, profile),
      })),
    [profile],
  );

  const brsr = results.find((row) => row.code === "BRSR_ANNUAL");
  const matches = results.filter((row) => row.applies);
  const reveal = brsrRevealKind(Boolean(brsr?.applies), isListed);
  const revealLabel = BRSR_REVEAL_COPY[reveal];

  function toggleWaste(stream: WasteStream) {
    setWaste((current) =>
      current.includes(stream) ? current.filter((item) => item !== stream) : [...current, stream],
    );
  }

  function resetForm() {
    setIsListed(false);
    setMarketCapRank("");
    setSector("Manufacturing");
    setEmployees("51_250");
    setTurnover("50_250cr");
    setNetWorth("50_250cr");
    setWaste([]);
    setExportsToEu(false);
    setCcts(false);
    setRan(false);
    setRankError("");
    setStepIndex(0);
    setCopied(false);
  }

  function submit() {
    if (isListed && !marketCapRank.trim()) {
      setRankError("Enter a market-cap rank.");
      const rankAt = steps.indexOf("rank");
      if (rankAt >= 0) setStepIndex(rankAt);
      return;
    }
    setRankError("");
    setRan(true);
  }

  const shareText = formatBrsrShareText({
    label: revealLabel,
    reason: brsr?.applies
      ? brsr.matches.map((match) => match.reason).join(" ")
      : "The sample BRSR rule requires a listed organisation with market-cap rank in the top 1000. Confirm current SEBI circulars with your company secretary.",
    matches: matches.map((row) => row.title),
  });

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <form
        className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (isLast) submit();
          else setStepIndex((i) => Math.min(i + 1, steps.length - 1));
        }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-[var(--mkt-safety)] transition-[width] duration-200 motion-reduce:transition-none"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {step === "listed" ? (
          <fieldset className="space-y-3">
            <legend className="text-base font-semibold text-foreground">Is this a listed company in India?</legend>
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--mkt-safety)]"
                checked={isListed}
                onChange={(event) => {
                  setIsListed(event.target.checked);
                  setStepIndex(0);
                }}
              />
              Listed company (India)
            </label>
          </fieldset>
        ) : null}

        {step === "rank" ? (
          <div className="space-y-2">
            <Label htmlFor="marketCapRank">What is the market-cap rank?</Label>
            <Input
              id="marketCapRank"
              type="number"
              min={1}
              placeholder="e.g. 420"
              value={marketCapRank}
              onChange={(event) => {
                setMarketCapRank(event.target.value);
                if (rankError) setRankError("");
              }}
              aria-invalid={Boolean(rankError)}
            />
            <p className="mkt-field-msg" data-show={rankError ? "true" : "false"} role={rankError ? "alert" : undefined}>
              {rankError || "\u00a0"}
            </p>
            <p className="text-xs text-muted-foreground">
              The sample BRSR rule matches listed organisations in the top 1000 by market-cap rank.
            </p>
          </div>
        ) : null}

        {step === "sector" ? (
          <div className="space-y-2">
            <Label htmlFor="sector">Which industry sector?</Label>
            <select
              id="sector"
              className={selectClass}
              value={sector}
              onChange={(event) => setSector(event.target.value)}
            >
              {SECTORS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {step === "employees" ? (
          <div className="space-y-2">
            <Label htmlFor="employees">How many employees?</Label>
            <select
              id="employees"
              className={selectClass}
              value={employees}
              onChange={(event) => setEmployees(event.target.value as EmployeeBand)}
            >
              {EMPLOYEE_BANDS.map((band) => (
                <option key={band} value={band}>
                  {EMPLOYEE_LABEL[band]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {step === "turnover" ? (
          <div className="space-y-2">
            <Label htmlFor="turnover">Turnover band</Label>
            <select
              id="turnover"
              className={selectClass}
              value={turnover}
              onChange={(event) => setTurnover(event.target.value as TurnoverBand)}
            >
              {TURNOVER_BANDS.map((band) => (
                <option key={band} value={band}>
                  {TURNOVER_LABEL[band]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {step === "netWorth" ? (
          <div className="space-y-2">
            <Label htmlFor="netWorth">Net worth band</Label>
            <select
              id="netWorth"
              className={selectClass}
              value={netWorth}
              onChange={(event) => setNetWorth(event.target.value as NetWorthBand)}
            >
              {NET_WORTH_BANDS.map((band) => (
                <option key={band} value={band}>
                  {NET_WORTH_LABEL[band]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {step === "waste" ? (
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Which waste streams are generated?</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {WASTE_STREAMS.map((stream) => (
                <label key={stream} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--mkt-safety)]"
                    checked={waste.includes(stream)}
                    onChange={() => toggleWaste(stream)}
                  />
                  {WASTE_LABEL[stream]}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === "eu" ? (
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--mkt-safety)]"
              checked={exportsToEu}
              onChange={(event) => setExportsToEu(event.target.checked)}
            />
            Export to the EU
          </label>
        ) : null}

        {step === "ccts" ? (
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--mkt-safety)]"
              checked={ccts}
              onChange={(event) => setCcts(event.target.checked)}
            />
            Operate in a CCTS-notified sector
          </label>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Back
          </Button>
          <Button type="submit" size="lg">
            {isLast ? "Check applicability" : "Continue"}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
        {!ran ? (
          <p className="mkt-body text-sm text-muted-foreground">
            Results use the same sample obligation library as the in-app compliance engine. They are orientation — not a legal opinion, not SEBI filing, and not a second rules engine.
          </p>
        ) : (
          <div key={`${isListed}-${marketCapRank}-${ran}`} className="mkt-fade-in space-y-5">
            <div className="rounded-xl border border-[var(--mkt-safety)]/35 bg-[color-mix(in_srgb,var(--mkt-safety)_8%,transparent)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--mkt-safety)]">
                BRSR (sample rule)
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-primary">{revealLabel}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {brsr?.applies
                  ? brsr.matches.map((match) => match.reason).join(" ")
                  : "The sample BRSR rule requires a listed organisation with market-cap rank in the top 1000. Confirm current SEBI circulars with your company secretary."}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Other sample matches</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {matches.length ? (
                  matches.map((row) => (
                    <li key={row.code}>
                      {row.title}{" "}
                      <span className="text-xs">({row.code})</span>
                    </li>
                  ))
                ) : (
                  <li>No sample obligations matched this profile.</li>
                )}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Start over
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={copyShare}>
                {copied ? "Copied" : "Copy result"}
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:?subject=${encodeURIComponent("BRSR sample result")}&body=${encodeURIComponent(shareText)}`}>
                  Share by email
                </a>
              </Button>
              <Button asChild size="sm">
                <Link href="/product/compliance-tracking">Compliance tracking</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Results use the same sample obligation library as the in-app compliance engine. They are orientation — not a legal opinion, not SEBI filing, and not a second rules engine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
