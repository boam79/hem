"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/lib/api-errors";
import type { Memo, PersonaKey } from "@/lib/schema";
import { MemoSchema } from "@/lib/schema";

const PERSONA_TOGGLES: { key: PersonaKey; label: string }[] = [
  { key: "cfo", label: "재무" },
  { key: "mkt", label: "마케팅" },
  { key: "md", label: "진료" },
];

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function MemoForm({ sessionId }: { sessionId: string }) {
  const [consensus, setConsensus] = useState("");
  const [issue, setIssue] = useState("");
  const [cfo, setCfo] = useState("");
  const [mkt, setMkt] = useState("");
  const [md, setMd] = useState("");
  const [missing, setMissing] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [supportA, setSupportA] = useState<PersonaKey[]>([]);
  const [supportB, setSupportB] = useState<PersonaKey[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(list: PersonaKey[], key: PersonaKey, set: (next: PersonaKey[]) => void) {
    set(list.includes(key) ? list.filter((item) => item !== key) : [...list, key]);
  }

  async function save() {
    setError(null);
    setSaved(false);
    const options = [
      optionA.trim()
        ? { option: optionA.trim(), supported_by: supportA }
        : null,
      optionB.trim()
        ? { option: optionB.trim(), supported_by: supportB }
        : null,
    ].filter((row): row is { option: string; supported_by: PersonaKey[] } =>
      Boolean(row),
    );
    const draft: Memo = {
      consensus: lines(consensus),
      open_issues: issue.trim()
        ? [
            {
              issue: issue.trim(),
              positions: { cfo: cfo.trim(), mkt: mkt.trim(), md: md.trim() },
            },
          ]
        : [],
      missing_data: lines(missing),
      options,
    };
    const parsed = MemoSchema.safeParse(draft);
    if (!parsed.success) {
      setError("메모 네 항목의 형식을 확인하세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/memo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, memo: parsed.data }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(apiErrorMessage(json, "메모 저장에 실패했습니다."));
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "메모 저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-lg font-semibold">사회자 메모</h2>
      <p className="text-muted-foreground text-sm">
        모델이 결정하지 않습니다. 합의·쟁점·공백·선택지만 적습니다.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>1. 합의점</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="한 줄에 하나씩"
            value={consensus}
            onChange={(e) => setConsensus(e.target.value)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>2. 미해결 쟁점</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            rows={2}
            placeholder="쟁점"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="재무이사 입장"
            value={cfo}
            onChange={(e) => setCfo(e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="마케팅실장 입장"
            value={mkt}
            onChange={(e) => setMkt(e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="진료원장 입장"
            value={md}
            onChange={(e) => setMd(e.target.value)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>3. 부족한 데이터</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="한 줄에 하나씩"
            value={missing}
            onChange={(e) => setMissing(e.target.value)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>4. 선택지</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OptionRow
            value={optionA}
            onChange={setOptionA}
            support={supportA}
            onToggle={(key) => toggle(supportA, key, setSupportA)}
            placeholder="선택지 A"
          />
          <OptionRow
            value={optionB}
            onChange={setOptionB}
            support={supportB}
            onToggle={(key) => toggle(supportB, key, setSupportB)}
            placeholder="선택지 B"
          />
        </CardContent>
      </Card>
      <Button type="button" size="lg" disabled={busy} onClick={save}>
        {busy ? "저장 중…" : "메모 저장"}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {saved ? (
        <p className="text-sm">
          저장했습니다. 공유 페이지를 새로고침하면 같은 내용이 보입니다.
        </p>
      ) : null}
    </section>
  );
}

function OptionRow({
  value,
  onChange,
  support,
  onToggle,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  support: PersonaKey[];
  onToggle: (key: PersonaKey) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {PERSONA_TOGGLES.map((p) => (
          <Button
            key={p.key}
            type="button"
            size="sm"
            variant={support.includes(p.key) ? "default" : "outline"}
            onClick={() => onToggle(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
