"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AICitation, AIToolResult } from "@/lib/ai/core/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: AICitation[];
  confidence?: number | null;
  toolResults?: AIToolResult[];
  configured?: boolean;
};

const SUGGESTIONS = [
  "Open CAPA items overdue in my organization",
  "List active permits at this site",
  "Summarize recent incidents (this tenant only)",
  "Draft a CAPA for the latest incident",
];

function messageText(parts: Array<{ type?: string; text?: string }> | undefined) {
  return (parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => String(part.text ?? ""))
    .join("\n");
}

export function CopilotChat({
  agentKey = "copilot",
  scope = "workspace",
  configured,
  suggestions = SUGGESTIONS,
}: {
  agentKey?: string;
  scope?: string;
  configured: boolean;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [fallbackMessages, setFallbackMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        fetch: async (input, init) => {
          const res = await fetch(input, init);
          const nextConversationId = res.headers.get("X-Conversation-Id");
          if (nextConversationId) {
            conversationIdRef.current = nextConversationId;
            setConversationId(nextConversationId);
          }
          return res;
        },
        prepareSendMessagesRequest({ messages, body }) {
          const lastUser = [...messages].reverse().find((m) => m.role === "user");
          const prompt = messageText(lastUser?.parts as Array<{ type?: string; text?: string }>);
          return {
            body: {
              ...body,
              messages,
              prompt,
              conversationId: conversationIdRef.current,
              agentKey,
              scope,
            },
          };
        },
      }),
    [agentKey, scope],
  );

  const {
    messages: streamMessages,
    sendMessage,
    status: streamStatus,
    error: streamError,
  } = useChat({
    transport,
  });

  const streaming = configured && streamStatus !== "ready";
  const displayMessages: ChatMessage[] = configured
    ? streamMessages.map((m) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        text: messageText(m.parts as Array<{ type?: string; text?: string }>),
        configured: true,
      }))
    : fallbackMessages;

  const sources = useMemo(
    () => displayMessages.flatMap((m) => m.citations ?? []),
    [displayMessages],
  );

  async function sendDeterministic(text: string) {
    const prompt = text.trim();
    if (!prompt || pending) return;
    setPending(true);
    setError(null);
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: prompt };
    setFallbackMessages((prev) => [...prev, userMsg]);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, conversationId, agentKey, scope }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || body.text || "Copilot request failed");
      }
      if (contentType.includes("application/json")) {
        const body = await res.json();
        setConversationId(body.conversationId ?? conversationId);
        setFallbackMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: body.text,
            citations: body.citations ?? [],
            confidence: body.confidence,
            toolResults: body.toolResults ?? [],
            configured: body.configured,
          },
        ]);
      } else {
        const raw = await res.text();
        setFallbackMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: raw.slice(0, 8000) || "Streamed response received.",
            configured: true,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copilot failed");
    } finally {
      setPending(false);
    }
  }

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || pending || streaming) return;
    setError(null);
    setInput("");
    if (configured) {
      await sendMessage({ text: prompt });
      return;
    }
    await sendDeterministic(prompt);
  }

  const activeError =
    error ?? (streamError ? (streamError.message || "Copilot failed") : null);
  const isPending = configured ? streaming : pending;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        {!configured ? (
          <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            AI is not configured. Structured lookups still run against this organization’s records — answers are never fabricated.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => void send(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="min-h-[320px] space-y-3 rounded-2xl border border-border bg-card p-4">
          {displayMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask about incidents, CAPA, permits, SDS, or documents in this organization.
            </p>
          ) : null}
          {displayMessages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "ml-8" : "mr-8"}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {m.role === "user" ? "You" : "Copilot"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{m.text}</p>
              {m.confidence != null ? (
                <Badge variant="secondary" className="mt-2">
                  Confidence {Math.round(m.confidence * 100)}%
                </Badge>
              ) : null}
            </div>
          ))}
          {isPending ? <p className="text-sm text-muted-foreground">Looking up authorized records…</p> : null}
          {activeError ? <p className="text-sm text-destructive">{activeError}</p> : null}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask EHS Copilot…"
            className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm"
          />
          <Button type="submit" disabled={isPending}>
            Send
          </Button>
        </form>
      </div>
      <aside className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Sources</h2>
        {sources.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Citations appear when a tool returns tenant records. Nothing is invented.
          </p>
        ) : (
          <ul className="space-y-2">
            {sources.map((s, i) => (
              <li key={`${s.sourceType}-${s.sourceId}-${i}`} className="text-xs">
                <p className="font-medium text-foreground">{s.title}</p>
                <p className="text-muted-foreground">
                  {s.sourceType}
                  {s.isCurrent === false ? " · not current" : ""}
                </p>
                {s.href ? (
                  <Link href={s.href} className="text-accent hover:underline">
                    Open record
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <Link href="/app/ai/actions" className="block text-xs font-medium text-accent hover:underline">
          Open suggestion approval center
        </Link>
      </aside>
    </div>
  );
}
