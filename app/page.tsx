"use client";

import { useEffect, useRef, useState } from "react";
import { Disclaimer } from "@/components/disclaimer";
import {
  ForestShell,
  ForestTimeline,
} from "@/components/forest-shell";
import { MeetingScene } from "@/components/meeting-scene";
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
import {
  DATA_REVIEW_AGENDA,
  agendaError,
  agendaLength,
  canStartDataReview,
  isAgendaValid,
} from "@/lib/agenda";
import { apiErrorMessage } from "@/lib/api-errors";
import type { DebateCell } from "@/lib/debate";
import { rememberSession } from "@/lib/recent-sessions";
import { readMetricsUploadStore } from "@/lib/metrics-upload-store";
import { readRoundTurns } from "@/lib/round-client";
import type { Category, PersonaKey } from "@/lib/schema";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "investment", label: "투자" },
  { value: "marketing", label: "마케팅" },
  { value: "staffing", label: "인력" },
  { value: "pricing", label: "가격" },
];

export default function Home() {
  const [agenda, setAgenda] = useState("백내장 검색광고 예산 30% 증액");
  const [category, setCategory] = useState<Category>("marketing");
  const [metrics, setMetrics] = useState<unknown | null>(null);
  const [metricsLabel, setMetricsLabel] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [sparkleBurst, setSparkleBurst] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [round1, setRound1] = useState<DebateCell[]>([]);
  const [round2, setRound2] = useState<DebateCell[]>([]);
  const [loadingRound, setLoadingRound] = useState<0 | 1 | 2>(0);
  const [round1Ms, setRound1Ms] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamPreview, setStreamPreview] = useState<
    Partial<Record<PersonaKey, string>>
  >({});
  const [personaNames, setPersonaNames] = useState<
    Partial<Record<PersonaKey, string>>
  >({});
  const runId = useRef(0);
  const prevFileCount = useRef(0);
  const clientAgendaError = agendaError(agenda);
  const agendaOk = isAgendaValid(agenda);
  const hasUploads = fileCount > 0;
  const dataReviewOk = canStartDataReview(hasUploads);
  const roundNumber: 1 | 2 =
    round2.length > 0 || loadingRound === 2 ? 2 : 1;

  useEffect(() => {
    void fetch("/api/personas")
      .then((res) => res.json())
      .then((json: { personas?: { key: PersonaKey; name: string }[] }) => {
        const map: Partial<Record<PersonaKey, string>> = {};
        for (const persona of json.personas ?? []) {
          map[persona.key] = persona.name;
        }
        setPersonaNames(map);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function hydrate() {
      const stored = readMetricsUploadStore();
      if (!stored) {
        setMetrics(null);
        setMetricsLabel(null);
        setFileCount(0);
        prevFileCount.current = 0;
        return;
      }
      setMetrics(stored.metrics);
      setMetricsLabel(stored.label);
      setFileCount(stored.files.length);
      if (stored.files.length > prevFileCount.current) {
        setSparkleBurst((n) => n + 1);
      }
      prevFileCount.current = stored.files.length;
    }
    hydrate();
    window.addEventListener("storage", hydrate);
    return () => window.removeEventListener("storage", hydrate);
  }, []);

  async function start(agendaText: string) {
    setError(null);
    if (!isAgendaValid(agendaText)) {
      setError(agendaError(agendaText));
      return;
    }
    const my = ++runId.current;
    setSessionId(null);
    setRound1([]);
    setRound2([]);
    setRound1Ms(null);
    setStreamPreview({});
    setSparkleBurst((n) => n + 1);
    setLoadingRound(1);
    try {
      const s = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda: agendaText.trim(),
          category,
          ...(metrics ? { metrics } : {}),
        }),
      });
      const sj = await s.json();
      if (runId.current !== my) return;
      if (!s.ok) {
        throw new Error(apiErrorMessage(sj));
      }
      setSessionId(sj.id);
      rememberSession(sj.id, agendaText.trim());
      const r1Started = performance.now();
      const r1Turns = await readRoundTurns(
        sj.id,
        1,
        (persona, text) => {
          if (runId.current !== my) return;
          setStreamPreview((prev) => ({
            ...prev,
            [persona]: `${prev[persona as PersonaKey] ?? ""}${text}`,
          }));
        },
        () => runId.current === my,
      );
      const r1Ms = Math.round(performance.now() - r1Started);
      if (runId.current !== my) return;
      setRound1Ms(r1Ms);
      setRound1(r1Turns);
      setStreamPreview({});
      setLoadingRound(2);
      const r2Turns = await readRoundTurns(
        sj.id,
        2,
        (persona, text) => {
          if (runId.current !== my) return;
          setStreamPreview((prev) => ({
            ...prev,
            [persona]: `${prev[persona as PersonaKey] ?? ""}${text}`,
          }));
        },
        () => runId.current === my,
      );
      if (runId.current !== my) return;
      setRound2(r2Turns);
    } catch (e) {
      if (runId.current !== my) return;
      if (e instanceof Error && e.message === "aborted") return;
      setError(e instanceof Error ? e.message : "실패");
    } finally {
      if (runId.current === my) {
        setStreamPreview({});
        setLoadingRound(0);
      }
    }
  }

  function leaveMeeting() {
    runId.current += 1;
    setSessionId(null);
    setRound1([]);
    setRound2([]);
    setRound1Ms(null);
    setLoadingRound(0);
    setStreamPreview({});
    setSparkleBurst(0);
    setError(null);
  }

  return (
    <ForestShell
      roundNumber={roundNumber}
      disclaimer={<Disclaimer />}
      sidebarLead={
        <section className="forest-agenda forest-agenda-lead">
          <label className="forest-field-label" htmlFor="agenda">
            안건
          </label>
          <Textarea
            id="agenda"
            rows={3}
            className="forest-agenda-input"
            value={agenda}
            aria-invalid={!agendaOk}
            onChange={(e) => setAgenda(e.target.value)}
          />
          <p className="forest-field-hint">
            {agendaLength(agenda)}/{AGENDA_MAX}자 (최소 {AGENDA_MIN}자)
          </p>
          {clientAgendaError ? (
            <p className="text-destructive mb-2 text-xs">{clientAgendaError}</p>
          ) : null}
          <label className="forest-field-label" htmlFor="category">
            유형
          </label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as Category)}
          >
            <SelectTrigger id="category" className="mb-1 w-full">
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
        </section>
      }
      sidebarExtra={
        <section className="forest-agenda">
          <p className="forest-field-hint mb-3">
            {metricsLabel ? metricsLabel : "없으면 기본 합성 지표를 씁니다."}{" "}
            <a className="forest-dummy-link" href="/files">
              파일 관리
            </a>
            에서 올립니다.
          </p>
          <Button
            type="button"
            size="lg"
            className="forest-start-btn w-full"
            disabled={loadingRound !== 0 || !agendaOk}
            onClick={() => void start(agenda)}
          >
            {loadingRound === 0 ? "토론 시작" : "토론 중…"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="forest-review-btn w-full"
            disabled={loadingRound !== 0 || !dataReviewOk}
            onClick={() => void start(DATA_REVIEW_AGENDA)}
          >
            데이터 검토
          </Button>
          <p className="forest-field-hint mt-2">
            {dataReviewOk
              ? "안건 없이 올린 지표의 위험·가정·필요 데이터를 올립니다."
              : "파일 관리에서 올리면 안건 없이 지표만 검토할 수 있습니다."}
          </p>
          {error ? (
            <p className="text-destructive mt-2 text-xs">{error}</p>
          ) : null}
          {sessionId && round1.length > 0 ? (
            <p className="forest-field-hint mt-2">
              {round1Ms !== null
                ? `라운드 1 ${round1Ms}ms · `
                : null}
              <a className="forest-dummy-link" href={`/debate?id=${sessionId}`}>
                토론 결과 보기
              </a>
            </p>
          ) : null}
        </section>
      }
      footer={
        <ForestTimeline
          hasUploads={hasUploads}
          loadingRound={loadingRound}
          round1Count={round1.length}
          round2Count={round2.length}
          sessionId={sessionId}
          roundNumber={roundNumber}
        />
      }
    >
      <MeetingScene
        fileCount={fileCount}
        burstId={sparkleBurst}
        hasUploads={hasUploads}
        loadingRound={loadingRound}
        round1={round1}
        round2={round2}
        names={personaNames}
        streamPreview={streamPreview}
        onLeave={leaveMeeting}
      />
    </ForestShell>
  );
}
