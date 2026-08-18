import type { AIModelTask, AIProviderName } from "@/lib/ai/core/types";
import { defaultModelForTask, isAiConfigured, readAiEnv } from "@/lib/ai/core/config";

export type ResolvedModel = {
  provider: AIProviderName;
  modelId: string;
  task: AIModelTask;
};

export class AIModelRouter {
  resolve(task: AIModelTask): ResolvedModel | null {
    if (!isAiConfigured()) return null;
    const env = readAiEnv();
    const provider = this.detectProvider(env);
    return { provider, modelId: defaultModelForTask(task, provider), task };
  }

  detectProvider(env = readAiEnv()): AIProviderName {
    if (env.provider) return env.provider;
    if (env.gatewayKey || process.env.VERCEL_OIDC_TOKEN) return "gateway";
    if (env.azureKey && env.azureEndpoint) return "azure";
    if (env.anthropicKey) return "anthropic";
    if (env.googleKey) return "google";
    return "openai";
  }
}

export const aiModelRouter = new AIModelRouter();

export async function loadLanguageModel(task: AIModelTask) {
  const resolved = aiModelRouter.resolve(task);
  if (!resolved) return null;

  if (resolved.provider === "gateway") {
    return { kind: "gateway" as const, model: resolved.modelId, resolved };
  }

  if (resolved.provider === "anthropic") {
    const mod = await import("@ai-sdk/anthropic").catch(() => null);
    if (!mod) return null;
    return { kind: "instance" as const, model: mod.anthropic(resolved.modelId), resolved };
  }

  if (resolved.provider === "google") {
    const mod = await import("@ai-sdk/google").catch(() => null);
    if (!mod) return null;
    return { kind: "instance" as const, model: mod.google(resolved.modelId), resolved };
  }

  const openaiMod = await import("@ai-sdk/openai").catch(() => null);
  if (!openaiMod) return null;
  const env = readAiEnv();
  if (resolved.provider === "azure") {
    const client = openaiMod.createOpenAI({
      baseURL: env.azureEndpoint,
      apiKey: env.azureKey,
    });
    return { kind: "instance" as const, model: client(resolved.modelId), resolved };
  }
  return { kind: "instance" as const, model: openaiMod.openai(resolved.modelId), resolved };
}

export type AIProvider = {
  name: AIProviderName;
  configured: boolean;
};

export function listProviders(): AIProvider[] {
  const env = readAiEnv();
  return [
    { name: "gateway", configured: Boolean(env.gatewayKey || process.env.VERCEL_OIDC_TOKEN) },
    { name: "openai", configured: Boolean(env.openaiKey) },
    { name: "azure", configured: Boolean(env.azureKey && env.azureEndpoint) },
    { name: "anthropic", configured: Boolean(env.anthropicKey) },
    { name: "google", configured: Boolean(env.googleKey) },
  ];
}
