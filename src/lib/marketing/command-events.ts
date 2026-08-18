export const MKT_COMMAND_EVENT = "mkt:command";

export function openMarketingCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MKT_COMMAND_EVENT));
}
