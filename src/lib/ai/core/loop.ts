import { AI_LOOP_LIMITS } from "@/lib/ai/core/config";

export { AI_LOOP_LIMITS };

export function loopBudgetExceeded(calls: number, iterations: number, elapsedMs: number, tokens: number) {
  return (
    calls >= AI_LOOP_LIMITS.maxToolCalls ||
    iterations >= AI_LOOP_LIMITS.maxIterations ||
    elapsedMs >= AI_LOOP_LIMITS.timeoutMs ||
    tokens >= AI_LOOP_LIMITS.tokenBudget
  );
}
