"use client";

import { useEffect, useState } from "react";
import { ProviderBadge } from "@/components/provider-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/lib/api-errors";
import type { PersonaOverride } from "@/lib/persona-overrides";
import type { PersonaKey, Provider } from "@/lib/schema";

type PublicPersona = PersonaOverride & {
  provider: Provider;
  modelId: string;
};

export function PersonaEditor() {
  const [rows, setRows] = useState<PublicPersona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/personas");
    const json = await res.json();
    if (!res.ok) {
      setError(apiErrorMessage(json, "페르소나를 읽지 못했습니다."));
      return;
    }
    setRows(json.personas as PublicPersona[]);
  }

  useEffect(() => {
    void load();
  }, []);

  function patch(key: PersonaKey, field: keyof PersonaOverride, value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]:
                field === "temperature" ? Number(value) : value,
            }
          : row,
      ),
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/personas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personas: rows.map((row) => ({
            key: row.key,
            name: row.name,
            role: row.role,
            habits: row.habits,
            temperature: row.temperature,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(json));
      setRows(json.personas as PublicPersona[]);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/personas", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(json));
      setRows(json.personas as PublicPersona[]);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "초기화에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="forest-panel">
      <h2 className="forest-panel-title">페르소나 편집</h2>
      <p className="forest-panel-copy">
        이름·역할·습관·temperature를 바꿀 수 있습니다. 프로바이더와 모델 ID는
        세 회사가 서로 다르도록 고정입니다. OpenAI nano는 temperature를 쓰지
        않습니다.
      </p>
      {rows.length === 0 ? (
        <p className="forest-panel-copy">페르소나를 불러오는 중…</p>
      ) : (
        <div className="settings-persona-grid settings-persona-edit">
          {rows.map((row) => (
            <article key={row.key} className="settings-persona">
              <header className="glance-head">
                <h3>{row.name}</h3>
                <ProviderBadge provider={row.provider} />
              </header>
              <p className="settings-model">{row.modelId}</p>
              <label className="forest-field-label" htmlFor={`persona-name-${row.key}`}>
                이름
              </label>
              <input
                id={`persona-name-${row.key}`}
                className="forest-agenda-input mb-2 w-full"
                value={row.name}
                onChange={(e) => patch(row.key, "name", e.target.value)}
              />
              <label className="forest-field-label" htmlFor={`persona-role-${row.key}`}>
                역할
              </label>
              <Textarea
                id={`persona-role-${row.key}`}
                rows={4}
                className="mb-2"
                value={row.role}
                onChange={(e) => patch(row.key, "role", e.target.value)}
              />
              <label className="forest-field-label" htmlFor={`persona-habits-${row.key}`}>
                습관
              </label>
              <Textarea
                id={`persona-habits-${row.key}`}
                rows={4}
                className="mb-2"
                value={row.habits}
                onChange={(e) => patch(row.key, "habits", e.target.value)}
              />
              <label className="forest-field-label" htmlFor={`persona-temp-${row.key}`}>
                temperature
              </label>
              <input
                id={`persona-temp-${row.key}`}
                type="number"
                min={0}
                max={1.2}
                step={0.1}
                className="forest-agenda-input w-full"
                value={row.temperature}
                onChange={(e) => patch(row.key, "temperature", e.target.value)}
              />
            </article>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" disabled={busy || rows.length !== 3} onClick={save}>
          {busy ? "저장 중…" : "페르소나 저장"}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={reset}>
          기본값으로
        </Button>
      </div>
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
      {saved ? <p className="mt-2 text-sm">저장했습니다. 다음 토론부터 반영됩니다.</p> : null}
    </section>
  );
}
