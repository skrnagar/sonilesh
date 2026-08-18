# AI guardrails

- **Injection:** user text is sanitized; retrieved docs are wrapped as untrusted data; jailbreak phrasing is refused.  
- **Tool validation:** org/user IDs stripped from model args; unknown / forbidden tools denied and audited.  
- **Rate limits:** 40 requests / 80k tokens per user per hour (in-memory; production Redis deferred).  
- **Redaction:** emails/phones minimized before model context.  
- **Language:** “potential root cause”, “potential risk signal”; no legal advice; no invented SDS procedures.  
- **Field:** read-only, self-scope. Header and tab bar are unchanged.

Retrieved content cannot override the system prompt because it is never prepended to it.
