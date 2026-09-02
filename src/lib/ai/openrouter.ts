import { createOpenAI } from "@ai-sdk/openai";
import type { AIModelTask } from "@/lib/ai/core/types";
import { readAiEnv } from "@/lib/ai/core/config";

/** OpenRouter OpenAI-compatible chat completions endpoint. */
export const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_API_BASE_URL = "https://openrouter.ai/api/v1";

export type OpenRouterEnv = {
  apiKey: string | undefined;
  model: string;
  siteUrl: string;
  appName: string;
};

export function readOpenRouterEnv(): OpenRouterEnv {
  return {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o",
    siteUrl:
      process.env.OPENROUTER_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
    appName:
      process.env.OPENROUTER_APP_NAME ||
      process.env.NEXT_PUBLIC_APP_NAME ||
      "SONIL EHS360",
  };
}

export function isOpenRouterConfigured() {
  return Boolean(readOpenRouterEnv().apiKey);
}

export function openRouterHeaders(env = readOpenRouterEnv()) {
  return {
    Authorization: `Bearer ${env.apiKey ?? ""}`,
    "HTTP-Referer": env.siteUrl,
    "X-Title": env.appName,
  };
}

/** Vercel AI SDK provider pointed at OpenRouter. */
export function createOpenRouterProvider(env = readOpenRouterEnv()) {
  if (!env.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return createOpenAI({
    baseURL: OPENROUTER_API_BASE_URL,
    apiKey: env.apiKey,
    headers: {
      "HTTP-Referer": env.siteUrl,
      "X-Title": env.appName,
    },
  });
}

export function resolveOpenRouterModelId(task: AIModelTask = "CHAT", env = readOpenRouterEnv()) {
  const aiEnv = readAiEnv();
  if (task === "CHAT" && aiEnv.chatModel) return aiEnv.chatModel;
  if (task === "RAG" && aiEnv.ragModel) return aiEnv.ragModel;
  if (
    (task === "ANALYSIS" || task === "RCA" || task === "AGENT_EXECUTION") &&
    aiEnv.analysisModel
  ) {
    return aiEnv.analysisModel;
  }
  return env.model;
}

export type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Direct server-side chat completion (non-streaming fallback / probes). */
export async function openRouterChatCompletion(input: {
  messages: OpenRouterChatMessage[];
  model?: string;
  maxTokens?: number;
  signal?: AbortSignal;
}) {
  const env = readOpenRouterEnv();
  if (!env.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...openRouterHeaders(env),
    },
    body: JSON.stringify({
      model: input.model ?? env.model,
      messages: input.messages,
      max_tokens: input.maxTokens,
    }),
    signal: input.signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter error ${res.status}: ${detail.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenRouter returned an empty completion");
  return text;
}
