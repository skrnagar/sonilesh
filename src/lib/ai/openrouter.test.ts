import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OPENROUTER_API_BASE_URL,
  OPENROUTER_CHAT_COMPLETIONS_URL,
  createOpenRouterProvider,
  isOpenRouterConfigured,
  openRouterHeaders,
  readOpenRouterEnv,
  resolveOpenRouterModelId,
} from "@/lib/ai/openrouter";

describe("openrouter config", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("reads env with safe defaults", () => {
    process.env.OPENROUTER_MODEL = "anthropic/claude-sonnet-4";
    process.env.OPENROUTER_SITE_URL = "https://app.example.com";
    process.env.OPENROUTER_APP_NAME = "Test App";
    const env = readOpenRouterEnv();
    expect(env.model).toBe("anthropic/claude-sonnet-4");
    expect(env.siteUrl).toBe("https://app.example.com");
    expect(env.appName).toBe("Test App");
  });

  it("builds required OpenRouter headers", () => {
    const headers = openRouterHeaders({
      apiKey: "test-key",
      model: "openai/gpt-4o",
      siteUrl: "https://sonil.example",
      appName: "SONIL EHS360",
    });
    expect(headers.Authorization).toBe("Bearer test-key");
    expect(headers["HTTP-Referer"]).toBe("https://sonil.example");
    expect(headers["X-Title"]).toBe("SONIL EHS360");
  });

  it("detects configuration from OPENROUTER_API_KEY", () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(isOpenRouterConfigured()).toBe(false);
    process.env.OPENROUTER_API_KEY = "sk-or-test";
    expect(isOpenRouterConfigured()).toBe(true);
  });

  it("creates an OpenAI-compatible provider for the AI SDK", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-test";
    process.env.OPENROUTER_MODEL = "openai/gpt-4o";
    const provider = createOpenRouterProvider();
    expect(provider).toBeDefined();
    expect(resolveOpenRouterModelId("CHAT")).toBe("openai/gpt-4o");
  });

  it("documents the chat completions endpoint", () => {
    expect(OPENROUTER_CHAT_COMPLETIONS_URL).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(OPENROUTER_API_BASE_URL).toBe("https://openrouter.ai/api/v1");
  });
});

describe("openRouterChatCompletion", () => {
  it("throws when the API key is missing", async () => {
    vi.resetModules();
    delete process.env.OPENROUTER_API_KEY;
    const mod = await import("@/lib/ai/openrouter");
    await expect(
      mod.openRouterChatCompletion({
        messages: [{ role: "user", content: "hello" }],
      }),
    ).rejects.toThrow(/OPENROUTER_API_KEY/);
  });
});
