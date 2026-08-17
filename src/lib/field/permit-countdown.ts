/** Tiny helper so field routes do not import the full permits service. */
export function permitCountdown(validTo: string | null | undefined, nowMs = Date.now()) {
  if (!validTo) return null;
  const ms = new Date(validTo).getTime() - nowMs;
  return {
    ms,
    expired: ms <= 0,
    hours: Math.max(0, Math.floor(ms / (1000 * 60 * 60))),
    minutes: Math.max(0, Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))),
    label:
      ms <= 0
        ? "Expired"
        : `${Math.floor(ms / (1000 * 60 * 60))}h ${Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))}m`,
  };
}
