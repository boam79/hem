import type { PersonaKey, Provider } from "@/lib/schema";

/** USD per 1M tokens. Estimates for the locked model IDs. Not provider-invoice truth. */
export const MODEL_RATES_USD_PER_MILLION: Record<
  string,
  { input: number; output: number }
> = {
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "gpt-5.4-nano": { input: 0.1, output: 0.4 },
  "gemini-3.1-flash-lite": { input: 0.075, output: 0.3 },
};

export const DEFAULT_MONTHLY_BUDGET_USD = 10;

export const PROVIDER_USAGE_URL: Record<Provider, string> = {
  anthropic: "https://console.anthropic.com/settings/usage",
  openai: "https://platform.openai.com/usage",
  google: "https://aistudio.google.com/usage",
};

export type TokenUsage = { input: number; output: number };

export function parseTurnUsage(raw: unknown): TokenUsage {
  if (!raw || typeof raw !== "object") return { input: 0, output: 0 };
  const o = raw as Record<string, unknown>;
  const input = Number(o.input);
  const output = Number(o.output);
  return {
    input: Number.isFinite(input) && input > 0 ? input : 0,
    output: Number.isFinite(output) && output > 0 ? output : 0,
  };
}

export function usdForModel(modelId: string, usage: TokenUsage): number {
  const rate = MODEL_RATES_USD_PER_MILLION[modelId] ?? {
    input: 1,
    output: 5,
  };
  return (usage.input * rate.input + usage.output * rate.output) / 1_000_000;
}

export function utcMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function remainingUsd(budgetUsd: number, spentUsd: number): number {
  return Math.max(0, roundMoney(budgetUsd - spentUsd));
}

export function roundMoney(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function formatUsd(value: number): string {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export type UsageTurnRow = {
  persona: string;
  provider: string;
  model: string;
  usage: unknown;
  created_at: string;
};

export type PersonaUsage = {
  key: PersonaKey;
  name?: string;
  provider: Provider;
  model: string;
  input: number;
  output: number;
  usd: number;
};

export function withPersonaSlots(
  byPersona: PersonaUsage[],
  slots: {
    key: PersonaKey;
    name: string;
    provider: Provider;
    model: string;
  }[],
): PersonaUsage[] {
  return slots.map((slot) => {
    const found = byPersona.find((row) => row.key === slot.key);
    return {
      key: slot.key,
      name: slot.name,
      provider: found?.provider ?? slot.provider,
      model: found?.model ?? slot.model,
      input: found?.input ?? 0,
      output: found?.output ?? 0,
      usd: found?.usd ?? 0,
    };
  });
}

export function summarizeUsage(
  rows: UsageTurnRow[],
  budgetUsd: number,
  now = new Date(),
): {
  month: string;
  budgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
  byPersona: PersonaUsage[];
} {
  const month = utcMonthKey(now);
  const monthRows = rows.filter((row) => row.created_at.startsWith(month));
  const byKey = new Map<string, PersonaUsage>();
  for (const row of monthRows) {
    const usage = parseTurnUsage(row.usage);
    const usd = usdForModel(row.model, usage);
    const prev = byKey.get(row.persona);
    if (prev) {
      prev.input += usage.input;
      prev.output += usage.output;
      prev.usd = roundMoney(prev.usd + usd);
    } else {
      byKey.set(row.persona, {
        key: row.persona as PersonaKey,
        provider: row.provider as Provider,
        model: row.model,
        input: usage.input,
        output: usage.output,
        usd: roundMoney(usd),
      });
    }
  }
  const byPersona = [...byKey.values()];
  const spentUsd = roundMoney(byPersona.reduce((sum, row) => sum + row.usd, 0));
  return {
    month,
    budgetUsd,
    spentUsd,
    remainingUsd: remainingUsd(budgetUsd, spentUsd),
    byPersona,
  };
}
