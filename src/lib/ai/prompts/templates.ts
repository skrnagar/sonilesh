export const PROMPT_TEMPLATE_KEYS = [
  "system.copilot",
  "system.field",
  "system.executive",
] as const;

export type PromptTemplateKey = (typeof PROMPT_TEMPLATE_KEYS)[number];
