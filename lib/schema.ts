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
  objection: z.string().max(200).optional(),
  changed: z.string().max(120).optional(),
});
export type TurnPayload = z.infer<typeof TurnSchema>;

export const TurnRound2Schema = TurnSchema.extend({
  objection: z.string().min(1).max(200),
  changed: z.string().min(1).max(120),
});

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
});
export type Metrics = z.infer<typeof MetricsSchema>;
