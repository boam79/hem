import { z } from "zod";

export const CategorySchema = z.enum([
  "investment",
  "marketing",
  "staffing",
  "pricing",
]);
export type Category = z.infer<typeof CategorySchema>;

export const PersonaKeySchema = z.enum(["cfo", "mkt", "md"]);
export type PersonaKey = z.infer<typeof PersonaKeySchema>;

export const ProviderSchema = z.enum(["anthropic", "openai", "google"]);
export type Provider = z.infer<typeof ProviderSchema>;

export const SessionCreateSchema = z.object({
  agenda: z.string().trim().min(10).max(200),
  category: CategorySchema,
  metrics: z.unknown().optional(),
});

export const RoundRequestSchema = z.object({
  sessionId: z.string().min(1),
  round: z.union([z.literal(1), z.literal(2)]),
});

export const TurnSchema = z.object({
  position: z.string().max(200),
  evidence: z.array(z.string().max(60)).min(1).max(4),
  risks: z.array(z.string().max(120)).max(3),
  needs_data: z.array(z.string().max(80)).max(3),
});
export type TurnPayload = z.infer<typeof TurnSchema> & {
  objection?: string;
  changed?: string;
};

export const ROUND2_EMPTY_FIELDS_ERROR =
  "round2 requires non-empty objection and changed";

export function isRound2EmptyFieldError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return msg.includes(ROUND2_EMPTY_FIELDS_ERROR);
}

export const TurnRound2Schema = TurnSchema.extend({
  objection: z.string().min(1).max(200),
  changed: z.string().min(1).max(120),
});

/** OpenAI structured output: every property required, no .optional() / min / max. */
export const TurnLlmSchema = z.object({
  position: z.string(),
  evidence: z.array(z.string()),
  risks: z.array(z.string()),
  needs_data: z.array(z.string()),
});

/** objection/changed first so cheap models fill F4 fields before the token cap. */
export const TurnRound2LlmSchema = z.object({
  objection: z
    .string()
    .describe("다른 부서 발언에 대한 짧은 한국어 반대 한 문장. 빈 문자열 금지."),
  changed: z
    .string()
    .describe('입장 변경 여부. 예: "유지: 현금흐름 우선". 빈 문자열 금지.'),
  position: z.string().describe("결론 1문장. objection보다 짧게."),
  evidence: z.array(z.string()),
  risks: z.array(z.string()),
  needs_data: z.array(z.string()),
});

function clipStr(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function clipArr(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .slice(0, maxItems)
    .map((s) => s.slice(0, maxLen));
}

export function parseTurnPayload(raw: unknown, round: 1 | 2): TurnPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("turn payload is not an object");
  }
  const o = raw as Record<string, unknown>;
  const base = {
    position: clipStr(o.position, 200),
    evidence: clipArr(o.evidence, 4, 60),
    risks: clipArr(o.risks, 3, 120),
    needs_data: clipArr(o.needs_data, 3, 80),
  };
  if (round === 2) {
    const objection = clipStr(o.objection, 200);
    const changed = clipStr(o.changed, 120);
    if (!objection || !changed) {
      throw new Error(ROUND2_EMPTY_FIELDS_ERROR);
    }
    return TurnRound2Schema.parse({
      ...base,
      objection,
      changed,
    });
  }
  return TurnSchema.parse(base);
}

export const MemoSchema = z.object({
  consensus: z.array(z.string()),
  open_issues: z.array(
    z.object({
      issue: z.string(),
      positions: z.object({
        cfo: z.string(),
        mkt: z.string(),
        md: z.string(),
      }),
    }),
  ),
  missing_data: z.array(z.string()),
  options: z.array(
    z.object({
      option: z.string(),
      supported_by: z.array(PersonaKeySchema),
    }),
  ),
});
export type Memo = z.infer<typeof MemoSchema>;

export const MemoPutSchema = z.object({
  sessionId: z.string().min(1),
  memo: MemoSchema,
});

export const MonthlyMetricsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  surgeries: z.object({
    lasik: z.number(),
    smile: z.number(),
    icl: z.number(),
    cataract: z.number(),
  }),
  per_doctor_surgeries: z.number(),
  revenue_mix: z.object({
    refractive: z.number(),
    cataract: z.number(),
    other: z.number(),
  }),
  inflow: z.object({
    search_ad: z.number(),
    social: z.number(),
    referral: z.number(),
    overseas_agency: z.number(),
  }),
  nationality_mix: z.object({
    domestic: z.number(),
    china: z.number(),
    japan: z.number(),
    other: z.number(),
  }),
  consult_to_surgery_rate: z.number().min(0.55).max(0.7),
  cashflow: z.object({
    in_man: z.number(),
    out_man: z.number(),
    net_man: z.number(),
  }),
});

export const DemographicsSchema = z.object({
  gender: z.object({
    male: z.number(),
    female: z.number(),
  }),
  age_bands: z.array(
    z.object({
      label: z.string(),
      share: z.number(),
    }),
  ),
  regions: z.array(
    z.object({
      label: z.string(),
      share: z.number(),
    }),
  ),
  departments: z.array(
    z.object({
      label: z.string(),
      share: z.number(),
    }),
  ),
});

export const MetricsSchema = z.object({
  _note: z.string(),
  hospital: z.object({
    name: z.string(),
    type: z.string(),
    doctors: z.number(),
  }),
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  monthly: z.array(MonthlyMetricsSchema).length(12),
  demographics: DemographicsSchema.optional(),
});
export type Metrics = z.infer<typeof MetricsSchema>;
