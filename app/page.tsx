"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloudUpload } from "lucide-react";
import { DebateGlance } from "@/components/debate-glance";
import { Disclaimer } from "@/components/disclaimer";
import {
  ForestDropzone,
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
import { agendaError, agendaLength, isAgendaValid } from "@/lib/agenda";
import { apiErrorMessage } from "@/lib/api-errors";
import type { DebateCell } from "@/lib/debate";
import {
  fileKind,
  formatBytes,
  formatShortDate,
  type UploadedMetricsFile,
} from "@/lib/forest-ui";
import { rememberSession } from "@/lib/recent-sessions";
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
  const [metrics, setMetrics] = useState<unknown | null>(null);
  const [metricsLabel, setMetricsLabel] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadedMetricsFile[]>([]);
  const [sparkleBurst, setSparkleBurst] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [round1, setRound1] = useState<DebateCell[]>([]);
  const [round2, setRound2] = useState<DebateCell[]>([]);
  const [loadingRound, setLoadingRound] = useState<0 | 1 | 2>(0);
  const [round1Ms, setRound1Ms] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsOpen, setResultsOpen] = useState(true);
  const runId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientAgendaError = agendaError(agenda);
  const agendaOk = isAgendaValid(agenda);
  const hasUploads = uploads.length > 0;
  const roundNumber: 1 | 2 =
    round2.length > 0 || loadingRound === 2 ? 2 : 1;
  const showResults =
    loadingRound !== 0 || round1.length > 0 || Boolean(sessionId);

  async function parseMetricsFile(file: File) {
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/metrics/parse", {
      method: "POST",
      body,
    });
    const json = await res.json();
    if (!res.ok) {
      setError(apiErrorMessage(json));
      return;
    }
    setMetrics(json.metrics);
    setMetricsLabel(`${json.hospital} · ${json.months}개월 (업로드)`);
    setUploads((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        uploadedAt: formatShortDate(),
        sizeLabel: formatBytes(file.size),
        kind: fileKind(file.name),
      },
    ]);
    setSparkleBurst((n) => n + 1);
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void parseMetricsFile(file).finally(() => {
      e.target.value = "";
    });
  }

  async function start() {
    setError(null);
    if (!agendaOk) {
      setError(clientAgendaError);
      return;
    }
    const my = ++runId.current;
    setSessionId(null);
    setRound1([]);
    setRound2([]);
    setRound1Ms(null);
    setResultsOpen(true);
    setLoadingRound(1);
    try {
      const s = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda: agenda.trim(),
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
      rememberSession(sj.id, agenda.trim());
      const r1Started = performance.now();
      const r1 = await fetch("/api/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sj.id, round: 1 }),
      });
      const r1Ms = Math.round(performance.now() - r1Started);
      if (runId.current !== my) return;
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
      if (runId.current !== my) return;
      if (r2.status === 422) {
        setError(apiErrorMessage(r2j));
        setRound2([]);
        return;
      }
      if (!r2.ok) throw new Error(apiErrorMessage(r2j));
      setRound2(r2j.turns);
    } catch (e) {
      if (runId.current !== my) return;
      setError(e instanceof Error ? e.message : "실패");
    } finally {
      if (runId.current === my) setLoadingRound(0);
    }
  }

  function leaveMeeting() {
    runId.current += 1;
    setSessionId(null);
    setRound1([]);
    setRound2([]);
    setRound1Ms(null);
    setLoadingRound(0);
    setMetrics(null);
    setMetricsLabel(null);
    setUploads([]);
    setSparkleBurst(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <ForestShell
      roundNumber={roundNumber}
      disclaimer={<Disclaimer />}
      files={uploads}
      dropzone={
        <ForestDropzone
          dragOver={dragOver}
          onDragOver={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (loadingRound !== 0) return;
            const dropped = [...e.dataTransfer.files].filter((file) =>
              /\.(csv|xlsx)$/i.test(file.name),
            );
            if (dropped.length === 0) {
              setError("CSV, XLSX 파일만 지원됩니다.");
              return;
            }
            void (async () => {
              for (const file of dropped) {
                await parseMetricsFile(file);
              }
            })();
          }}
        >
          <input
            ref={fileInputRef}
            id="metrics-file"
            type="file"
            accept=".csv,.xlsx"
            aria-label="경영 지표 파일"
            className="metrics-file-hit"
            disabled={loadingRound !== 0}
            onChange={onFileInputChange}
          />
          <CloudUpload className="dropzone-cloud" strokeWidth={1.75} />
          <p className="dropzone-lead">파일을 드래그하거나</p>
          <button
            type="button"
            className="file-pick-btn"
            disabled={loadingRound !== 0}
            onClick={() => fileInputRef.current?.click()}
          >
            파일 선택
          </button>
          <p className="dropzone-hint">CSV, XLSX 파일만 지원됩니다.</p>
        </ForestDropzone>
      }
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
            더미:{" "}
            <a className="forest-dummy-link" href="/dummy/patient-and-cashflow.csv">
              CSV
            </a>
            {" · "}
            <a
              className="forest-dummy-link"
              href="/dummy/patient-and-cashflow.xlsx"
            >
              엑셀
            </a>
          </p>
          <Button
            type="button"
            size="lg"
            className="forest-start-btn w-full"
            disabled={loadingRound !== 0 || !agendaOk}
            onClick={start}
          >
            {loadingRound === 0 ? "토론 시작" : "토론 중…"}
          </Button>
          {error ? (
            <p className="text-destructive mt-2 text-xs">{error}</p>
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
      {showResults ? (
        <section className="forest-results">
          <button
            type="button"
            className="forest-results-toggle"
            aria-expanded={resultsOpen}
            onClick={() => setResultsOpen((open) => !open)}
          >
            <span>토론 결과</span>
            <span className="forest-results-chevron" data-open={resultsOpen}>
              ▾
            </span>
          </button>
          {resultsOpen ? (
            <div className="forest-results-body">
              {round1Ms !== null ? (
                <p className="text-muted-foreground mb-2 text-xs">
                  라운드 1 {round1Ms}ms
                  {round1Ms > 30_000 ? " · 30초 초과" : " · 30초 이내"}
                </p>
              ) : null}
              <DebateGlance
                round1={round1}
                round2={round2}
                loadingRound={loadingRound}
              />
              <p className="forest-results-links">
                {sessionId ? (
                  <>
                    전체 그리드:{" "}
                    <a className="forest-dummy-link" href={`/s/${sessionId}`}>
                      /s/{sessionId}
                    </a>
                    {loadingRound === 0 ? (
                      <>
                        {" · "}
                        <a
                          className="forest-dummy-link"
                          href={`/decision?id=${sessionId}`}
                        >
                          사회자 메모 작성
                        </a>
                      </>
                    ) : null}
                  </>
                ) : (
                  "발언이 끝나면 공유 링크가 생깁니다."
                )}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
      <MeetingScene
        compact={showResults}
        fileCount={uploads.length}
        burstId={sparkleBurst}
        hasUploads={hasUploads}
        loadingRound={loadingRound}
        round1={round1}
        round2={round2}
        onLeave={leaveMeeting}
      />
    </ForestShell>
  );
}
