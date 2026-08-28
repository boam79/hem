"use client";

import { useState } from "react";
import { DebateGrid } from "@/components/debate-grid";
import { Disclaimer } from "@/components/disclaimer";
import { MemoForm } from "@/components/memo-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AGENDA_MAX, AGENDA_MIN } from "@/config/limits";
import { agendaError, agendaLength, isAgendaValid } from "@/lib/agenda";
import { apiErrorMessage } from "@/lib/api-errors";
import type { DebateCell } from "@/lib/debate";
import type { Category } from "@/lib/schema";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "investment", label: "투자" },
  { value: "marketing", label: "마케팅" },
  { value: "staffing", label: "인력" },
  { value: "pricing", label: "가격" },
];

export default function Home() {
  const [agenda, setAgenda] = useState("백내장 검색광고 예산 30% 증액");
  const [category, setCategory] = useState<Category>("marketing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [round1, setRound1] = useState<DebateCell[]>([]);
  const [round2, setRound2] = useState<DebateCell[]>([]);
  const [loadingRound, setLoadingRound] = useState<0 | 1 | 2>(0);
  const [round1Ms, setRound1Ms] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientAgendaError = agendaError(agenda);
  const agendaOk = isAgendaValid(agenda);

  async function start() {
    setError(null);
    if (!agendaOk) {
      setError(clientAgendaError);
      return;
    }
    setSessionId(null);
    setRound1([]);
    setRound2([]);
    setRound1Ms(null);
    setLoadingRound(1);
    try {
      const s = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agenda: agenda.trim(), category }),
      });
      const sj = await s.json();
      if (!s.ok) {
        throw new Error(apiErrorMessage(sj));
      }
      setSessionId(sj.id);
      const r1Started = performance.now();
      const r1 = await fetch("/api/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sj.id, round: 1 }),
      });
      const r1Ms = Math.round(performance.now() - r1Started);
      setRound1Ms(r1Ms);
      const r1j = await r1.json();
      if (!r1.ok) throw new Error(apiErrorMessage(r1j));
      setRound1(r1j.turns);
      setLoadingRound(2);
      const r2 = await fetch("/api/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sj.id, round: 2 }),
      });
      const r2j = await r2.json();
      if (r2.status === 422) {
        setError(apiErrorMessage(r2j));
        setRound2([]);
        return;
      }
      if (!r2.ok) throw new Error(apiErrorMessage(r2j));
      setRound2(r2j.turns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    } finally {
      setLoadingRound(0);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <Disclaimer />
      <h1 className="mb-4 text-2xl font-semibold">병원 경영회의 시뮬레이터</h1>
      <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
        세 회사의 모델이 서로 다른 입장을 냅니다. 결정을 대신하지 않습니다.
      </p>
      <label className="mb-2 block text-sm" htmlFor="agenda">
        안건
      </label>
      <Textarea
        id="agenda"
        rows={3}
        className="mb-1"
        value={agenda}
        aria-invalid={!agendaOk}
        onChange={(e) => setAgenda(e.target.value)}
      />
      <p className="text-muted-foreground mb-3 text-xs">
        {agendaLength(agenda)}/{AGENDA_MAX}자 (최소 {AGENDA_MIN}자)
      </p>
      {clientAgendaError ? (
        <p className="text-destructive mb-3 text-sm">{clientAgendaError}</p>
      ) : null}
      <label className="mb-2 block text-sm" htmlFor="category">
        유형
      </label>
      <Select
        value={category}
        onValueChange={(value) => setCategory(value as Category)}
      >
        <SelectTrigger id="category" className="mb-4 w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div>
        <Button
          type="button"
          size="lg"
          disabled={loadingRound !== 0 || !agendaOk}
          onClick={start}
        >
          {loadingRound === 0 ? "토론 시작" : "토론 중…"}
        </Button>
      </div>
      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
      {round1Ms !== null ? (
        <p className="text-muted-foreground mt-3 text-sm">
          라운드 1 {round1Ms}ms
          {round1Ms > 30_000 ? " · 30초 초과" : " · 30초 이내"}
        </p>
      ) : null}
      <DebateGrid
        round1={round1}
        round2={round2}
        loadingRound={loadingRound}
      />
      {sessionId ? (
        <p className="mt-6 text-sm">
          공유:{" "}
          <a className="underline" href={`/s/${sessionId}`}>
            /s/{sessionId}
          </a>
        </p>
      ) : null}
      {sessionId && loadingRound === 0 ? <MemoForm sessionId={sessionId} /> : null}
    </main>
  );
}
