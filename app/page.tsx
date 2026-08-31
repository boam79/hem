"use client";

import { useEffect, useRef, useState } from "react";
import { Disclaimer } from "@/components/disclaimer";
import { HomeMetricsUpload } from "@/components/home-metrics-upload";
import { ForestShell } from "@/components/forest-shell";
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
import { debateStartBody } from "@/lib/debate-start";
import { apiErrorMessage } from "@/lib/api-errors";
import type { DebateCell } from "@/lib/debate";
import { rememberSession } from "@/lib/recent-sessions";
import {
  readMetricsUploadStore,
  type MetricsUploadStore,
} from "@/lib/metrics-upload-store";
import type { UploadedMetricsFile } from "@/lib/forest-ui";
import { readRoundTurns } from "@/lib/round-client";
import type { Category, PersonaKey } from "@/lib/schema";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "investment", label: "투자" },
  { value: "marketing", label: "마케팅" },
  { value: "staffing", label: "인력" },
  { value: "pricing", label: "가격" },
];

export default function Home() {
  const [agenda, setAgenda] = useState(
    "1. 외래 환자 수 감소 원인 분석\n2. 마케팅 캠페인 예산 검토\n3. 신규 진료과 개설 타당성 검토\n4. 비용 절감 방안 논의",
  );
  const [category, setCategory] = useState<Category>("marketing");
  const [metrics, setMetrics] = useState<unknown | null>(null);
  const [metricsLabel, setMetricsLabel] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadedMetricsFile[]>([]);
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
  const [chooserOpen, setChooserOpen] = useState(false);
  const runId = useRef(0);
  const prevFileCount = useRef(0);
  const clientAgendaError = agendaError(agenda);
  const agendaOk = isAgendaValid(agenda);
  const fileCount = uploads.length;
  const hasUploads = fileCount > 0;
  const dataReviewOk = canStartDataReview(hasUploads);
  const roundNumber: 1 | 2 =
    round2.length > 0 || loadingRound === 2 ? 2 : 1;

  function applyStore(store: MetricsUploadStore | null) {
    if (!store) {
      setMetrics(null);
      setMetricsLabel(null);
      setUploads([]);
      prevFileCount.current = 0;
      return;
    }
    setMetrics(store.metrics);
    setMetricsLabel(store.label);
    setUploads(store.files);
    if (store.files.length > prevFileCount.current) {
      setSparkleBurst((n) => n + 1);
    }
    prevFileCount.current = store.files.length;
  }

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
      applyStore(readMetricsUploadStore());
    }
    hydrate();
    window.addEventListener("storage", hydrate);
    return () => window.removeEventListener("storage", hydrate);
  }, []);

  useEffect(() => {
    if (!chooserOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setChooserOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chooserOpen]);

  function openChooser() {
    setError(null);
    if (!isAgendaValid(agenda)) {
      setError(agendaError(agenda));
      return;
    }
    setChooserOpen(true);
  }

  async function start(agendaText: string, useUploadedMetrics: boolean) {
    setChooserOpen(false);
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
        body: JSON.stringify(
          debateStartBody({
            agenda: agendaText,
            category,
            metrics,
            useUploadedMetrics,
          }),
        ),
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
    setChooserOpen(false);
  }

  return (
    <ForestShell
      roundNumber={roundNumber}
      disclaimer={<Disclaimer />}
      headerEnd={
        <Button
          type="button"
          size="lg"
          className="forest-start-btn header-next-turn"
          aria-label="시뮬레이션 다음 턴"
          disabled={loadingRound !== 0 || !agendaOk}
          onClick={openChooser}
        >
          {loadingRound === 0 ? "시뮬레이션 다음 턴 →" : "토론 중…"}
        </Button>
      }
      sidebarLead={
        <section className="forest-agenda forest-agenda-lead">
          <label className="forest-field-label" htmlFor="agenda">
            회의 안건
          </label>
          <p className="forest-field-hint forest-field-lead">
            이번 턴의 주요 안건을 입력하세요.
          </p>
          <Textarea
            id="agenda"
            rows={8}
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
          <Button
            type="button"
            size="lg"
            className="forest-start-btn mt-3 w-full"
            aria-label="토론 시작"
            disabled={loadingRound !== 0 || !agendaOk}
            onClick={openChooser}
          >
            {loadingRound === 0 ? "토론 시작" : "토론 중…"}
          </Button>
        </section>
      }
      sidebarExtra={
        <>
          <HomeMetricsUpload
            files={uploads}
            onStore={(store, parsed) => {
              applyStore(store);
              if (parsed) setMetrics(store.metrics);
            }}
          />
          <section className="forest-agenda">
            {metricsLabel ? (
              <p className="forest-field-hint mb-3">{metricsLabel}</p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="forest-review-btn w-full"
              disabled={loadingRound !== 0 || !dataReviewOk}
              onClick={() => void start(DATA_REVIEW_AGENDA, true)}
            >
              데이터 검토
            </Button>
            <p className="forest-field-hint mt-2">
              {dataReviewOk
                ? "안건 없이 올린 지표의 위험·가정·필요 데이터를 올립니다."
                : "지표를 올리면 안건 없이 지표만 검토할 수 있습니다."}
            </p>
            {error ? (
              <p className="text-destructive mt-2 text-xs">{error}</p>
            ) : null}
            {sessionId && round1.length > 0 ? (
              <p className="forest-field-hint mt-2">
                {round1Ms !== null ? `라운드 1 ${round1Ms}ms · ` : null}
                <a className="forest-dummy-link" href={`/debate?id=${sessionId}`}>
                  토론 결과 보기
                </a>
              </p>
            ) : null}
          </section>
        </>
      }
      footer={
        chooserOpen ? (
          <div
            className="start-chooser-backdrop"
            onClick={() => setChooserOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="start-chooser-title"
              className="start-chooser"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="start-chooser-title" className="start-chooser-title">
                토론을 어떻게 진행할까요?
              </h2>
              <p className="start-chooser-copy">
                올린 파일을 넣을지, 기본 합성 지표만 쓸지 고릅니다. 결정은 하지
                않습니다.
              </p>
              <Button
                type="button"
                size="lg"
                className="forest-start-btn w-full"
                disabled={!metrics}
                onClick={() => void start(agenda, true)}
              >
                올린 데이터로 진행
              </Button>
              <p className="forest-field-hint mt-1.5 mb-3">
                {metrics
                  ? "지금 올린 파일을 세 입장에 넣습니다."
                  : "올린 파일이 없습니다. 지표를 올리면 이 칸을 고를 수 있습니다."}
              </p>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="forest-review-btn mt-0 w-full"
                onClick={() => void start(agenda, false)}
              >
                그냥 진행
              </Button>
              <p className="forest-field-hint mt-1.5 mb-3">
                올린 파일은 넣지 않고 기본 합성 지표만 씁니다.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setChooserOpen(false)}
              >
                취소
              </Button>
            </div>
          </div>
        ) : null
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
