import type { ExternalRecord, IntegrationProvider, SyncCursor, SyncMode } from "@/lib/integrations/types";

export class CsvManualProvider implements IntegrationProvider {
  code = "csv_manual";
  maturity = "real" as const;

  async fetch(input: {
    mode: SyncMode;
    cursor: SyncCursor;
    config: Record<string, unknown>;
  }) {
    const staged = Array.isArray(input.config.records)
      ? (input.config.records as ExternalRecord[])
      : [];
    return {
      records: staged,
      nextCursor: input.cursor,
      note: "CSV records are supplied by the import pipeline, not a vendor SDK.",
    };
  }
}

export class SandboxVendorProvider implements IntegrationProvider {
  constructor(
    public code: string,
    public maturity: "sandbox" | "architecture" = "sandbox",
  ) {}

  async fetch() {
    return {
      records: [] as ExternalRecord[],
      nextCursor: {} as SyncCursor,
      note: `${this.code} is ${this.maturity}-only. Not tested against the real provider.`,
    };
  }
}

/** Architecture stub. Never invents meter readings. */
export class IotMetersProvider implements IntegrationProvider {
  code = "iot_meters";
  maturity = "architecture" as const;

  async fetch() {
    return {
      records: [] as ExternalRecord[],
      nextCursor: {} as SyncCursor,
      note: "IoT/meter live data is not implemented. Architecture contract only.",
    };
  }
}

export function providerFor(code: string): IntegrationProvider {
  if (code === "csv_manual") return new CsvManualProvider();
  if (code === "iot_meters") return new IotMetersProvider();
  if (code === "idp_oidc") return new SandboxVendorProvider(code, "architecture");
  return new SandboxVendorProvider(code, "sandbox");
}
