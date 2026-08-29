import { describe, expect, it } from "vitest";
import { PERSONAS } from "@/config/personas";
import {
  PersonaOverridesBodySchema,
  defaultOverrides,
  mergePersona,
  mergePersonas,
} from "@/lib/persona-overrides";

describe("mergePersona", () => {
  it("keeps provider and model while applying name and role", () => {
    const next = mergePersona(PERSONAS[0], {
      key: "cfo",
      name: "재무본부장",
      role: "현금흐름을 최우선으로 보는 재무 책임자입니다.",
      habits: "회수기간을 먼저 묻고 고정비 증가를 지적한다.",
      temperature: 0.2,
    });
    expect(next.provider).toBe("anthropic");
    expect(next.modelId).toBe(PERSONAS[0].modelId);
    expect(next.name).toBe("재무본부장");
    expect(next.temperature).toBe(0.2);
  });

  it("rejects a body that is missing a persona", () => {
    const parsed = PersonaOverridesBodySchema.safeParse({
      personas: defaultOverrides().slice(0, 2),
    });
    expect(parsed.success).toBe(false);
  });

  it("keeps three distinct providers after merge", () => {
    const merged = mergePersonas(defaultOverrides());
    expect(new Set(merged.map((p) => p.provider)).size).toBe(3);
  });

  it("coerces temperature from a numeric string", () => {
    const parsed = PersonaOverridesBodySchema.safeParse({
      personas: defaultOverrides().map((row) => ({
        key: row.key,
        name: row.name,
        role: row.role,
        habits: row.habits,
        temperature: String(row.temperature),
      })),
    });
    expect(parsed.success).toBe(true);
  });
});
