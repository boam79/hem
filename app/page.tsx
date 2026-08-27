"use client";

import { useState } from "react";
import { AGENDA_MAX, AGENDA_MIN } from "@/config/limits";
import { PERSONAS } from "@/config/personas";
import type { Category, TurnPayload } from "@/lib/schema";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "investment", label: "투자" },
  { value: "marketing", label: "마케팅" },
  { value: "staffing", label: "인력" },
  { value: "pricing", label: "가격" },
];

type Cell = {
  persona: string;
  provider: string;
  status: string;
  payload?: TurnPayload;
  error?: string;
};

export default function Home() {
  const [agenda, setAgenda] = useState("백내장 검색광고 예산 30% 증액");
  const [category, setCategory] = useState<Category>("marketing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [round1, setRound1] = useState<Cell[]>([]);
  const [round2, setRound2] = useState<Cell[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agendaOk = agenda.trim().length >= AGENDA_MIN && agenda.trim().length <= AGENDA_MAX;

  async function start() {
    setError(null);
    if (!agendaOk) {
      setError(`안건은 ${AGENDA_MIN}~${AGENDA_MAX}자여야 합니다.`);
      return;
    }
    setBusy(true);
    try {
      const s = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agenda: agenda.trim(), category }),
      });
      const sj = await s.json();
      if (!s.ok) {
        throw new Error(sj.error || s.statusText);
      }
      setSessionId(sj.id);
      const r1 = await fetch("/api/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sj.id, round: 1 }),
      });
      const r1j = await r1.json();
      if (!r1.ok) throw new Error(r1j.error || r1.statusText);
      setRound1(r1j.turns);
      const r2 = await fetch("/api/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sj.id, round: 2 }),
      });
      const r2j = await r2.json();
      if (r2.status === 422) {
        setError("라운드 1 성공 셀이 2개 미만이라 라운드 2를 건너뜁니다.");
        return;
      }
      if (!r2.ok) throw new Error(r2j.error || r2.statusText);
      setRound2(r2j.turns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <p className="mb-2 text-sm text-neutral-600">
        AI 토론 결과이며 결정은 사람이 합니다.
      </p>
      <h1 className="mb-4 text-2xl font-semibold">병원 경영회의 시뮬레이터</h1>
      <label className="mb-2 block text-sm">안건</label>
      <textarea
        className="mb-3 w-full rounded border border-neutral-300 bg-white p-3"
        rows={3}
        value={agenda}
        onChange={(e) => setAgenda(e.target.value)}
      />
      <label className="mb-2 block text-sm">유형</label>
      <select
        className="mb-4 rounded border border-neutral-300 bg-white p-2"
        value={category}
        onChange={(e) => setCategory(e.target.value as Category)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <div>
        <button
          type="button"
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
          disabled={busy || !agendaOk}
          onClick={start}
        >
          {busy ? "토론 중…" : "토론 시작"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <Grid round1={round1} round2={round2} />
      {sessionId ? (
        <p className="mt-6 text-sm">
          공유:{" "}
          <a className="underline" href={`/s/${sessionId}`}>
            /s/{sessionId}
          </a>
        </p>
      ) : null}
    </main>
  );
}

function Grid({ round1, round2 }: { round1: Cell[]; round2: Cell[] }) {
  if (round1.length === 0) return null;
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border p-2" />
            {PERSONAS.map((p) => (
              <th key={p.key} className="border p-2">
                {p.name}{" "}
                <span className="rounded bg-neutral-200 px-1 text-xs">
                  {p.provider}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2 font-medium">R1</td>
            {PERSONAS.map((p) => (
              <td key={p.key} className="border p-2 align-top">
                <CellView cell={round1.find((c) => c.persona === p.key)} />
              </td>
            ))}
          </tr>
          <tr>
            <td className="border p-2 font-medium">R2</td>
            {PERSONAS.map((p) => (
              <td key={p.key} className="border p-2 align-top">
                <CellView cell={round2.find((c) => c.persona === p.key)} round2 />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CellView({ cell, round2 }: { cell?: Cell; round2?: boolean }) {
  if (!cell) {
    return <span className="text-neutral-400">대기</span>;
  }
  if (cell.status !== "ok") {
    return <span>발언 불가 ({cell.error || cell.status})</span>;
  }
  const p = cell.payload;
  if (!p) return null;
  return (
    <div>
      <p className="font-semibold">{p.position}</p>
      <p className="mt-1 text-xs text-neutral-600">{p.evidence.join(" · ")}</p>
      {round2 && p.objection ? (
        <p className="mt-2 text-xs">반대: {p.objection}</p>
      ) : null}
      {round2 && p.changed ? (
        <p className="text-xs">변경: {p.changed}</p>
      ) : null}
    </div>
  );
}
