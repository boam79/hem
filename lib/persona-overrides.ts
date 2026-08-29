import { z } from "zod";
import { PERSONAS, type Persona } from "@/config/personas";
import { PersonaKeySchema, type PersonaKey } from "@/lib/schema";

export const PersonaOverrideSchema = z.object({
  key: PersonaKeySchema,
  name: z.string().trim().min(2).max(24),
  role: z.string().trim().min(10).max(500),
  habits: z.string().trim().min(10).max(500),
  temperature: z.coerce.number().min(0).max(1.2),
});

export type PersonaOverride = z.infer<typeof PersonaOverrideSchema>;

export const PersonaOverridesBodySchema = z.object({
  personas: z.array(PersonaOverrideSchema).length(3),
});

export function mergePersona(
  base: Persona,
  override?: PersonaOverride | null,
): Persona {
  if (!override || override.key !== base.key) return base;
  return {
    ...base,
    name: override.name,
    role: override.role,
    habits: override.habits,
    temperature: override.temperature,
  };
}

export function mergePersonas(
  overrides: PersonaOverride[],
): [Persona, Persona, Persona] {
  const byKey = new Map(overrides.map((row) => [row.key, row]));
  return PERSONAS.map((base) => mergePersona(base, byKey.get(base.key))) as [
    Persona,
    Persona,
    Persona,
  ];
}

export function defaultOverrides(): PersonaOverride[] {
  return PERSONAS.map((p) => ({
    key: p.key,
    name: p.name,
    role: p.role,
    habits: p.habits,
    temperature: p.temperature,
  }));
}

export function publicPersonas(personas: Persona[]): {
  key: PersonaKey;
  name: string;
  provider: Persona["provider"];
  modelId: string;
  temperature: number;
  role: string;
  habits: string;
}[] {
  return personas.map((p) => ({
    key: p.key,
    name: p.name,
    provider: p.provider,
    modelId: p.modelId,
    temperature: p.temperature,
    role: p.role,
    habits: p.habits,
  }));
}
