import type { AIModelTask, AIProviderName } from "@/lib/ai/core/types";

export const AI_LOOP_LIMITS = {
  maxToolCalls: 8,
  maxIterations: 6,
  timeoutMs: 45_000,
  tokenBudget: 8_000,
  maxRetrievedChunks: 8,
  maxRowsPerTool: 25,
} as const;

export const AI_RATE_LIMIT = {
  requestsPerHour: 40,
  tokensPerHour: 80_000,
} as const;

export function readAiEnv() {
  const provider = (process.env.AI_PROVIDER ?? "").toLowerCase() as AIProviderName | "";
  return {
    provider: AI_PROVIDERS_SET.has(provider) ? provider : null,
    gatewayKey: process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY,
    openrouterKey: process.env.OPENROUTER_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    googleKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
    azureKey: process.env.AZURE_OPENAI_API_KEY,
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    chatModel: process.env.AI_MODEL_CHAT || process.env.OPENROUTER_MODEL,
    ragModel: process.env.AI_MODEL_RAG,
    analysisModel: process.env.AI_MODEL_ANALYSIS,
  };
}

const AI_PROVIDERS_SET = new Set(["gateway", "openrouter", "openai", "azure", "anthropic", "google"]);

export function isAiConfigured() {
  const env = readAiEnv();
  return Boolean(
    env.gatewayKey ||
      process.env.VERCEL_OIDC_TOKEN ||
      env.openrouterKey ||
      env.openaiKey ||
      env.anthropicKey ||
      env.googleKey ||
      (env.azureKey && env.azureEndpoint),
  );
}

export function defaultModelForTask(task: AIModelTask, provider: AIProviderName): string {
  const env = readAiEnv();
  if (task === "CHAT" && env.chatModel) return env.chatModel;
  if (task === "RAG" && env.ragModel) return env.ragModel;
  if ((task === "ANALYSIS" || task === "RCA" || task === "AGENT_EXECUTION") && env.analysisModel) {
    return env.analysisModel;
  }

  if (provider === "anthropic") {
    return task === "CLASSIFICATION" || task === "EXTRACTION"
      ? "claude-haiku-4-5"
      : "claude-sonnet-4-5";
  }
  if (provider === "google") {
    return "gemini-2.5-flash";
  }
  if (provider === "azure") {
    return env.azureDeployment || "gpt-4.1-mini";
  }
  if (provider === "gateway") {
    return task === "CLASSIFICATION" || task === "SUMMARIZATION"
      ? "openai/gpt-4.1-mini"
      : "openai/gpt-4.1-mini";
  }
  if (provider === "openrouter") {
    return process.env.OPENROUTER_MODEL || "openai/gpt-4o";
  }
  return "gpt-4.1-mini";
}
