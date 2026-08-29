"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloudUpload } from "lucide-react";
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
  const [uploads, setUploads] = useState<UploadedMetricsFile[]>([]);
  const [sparkleBurst, setSparkleBurst] = useState(0);
  const [dragOver, setDragOver] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientAgendaError = agendaError(agenda);
  const agendaOk = isAgendaValid(agenda);
  const hasUploads = uploads.length > 0;
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
    setStreamPreview({});
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
        fileCount={uploads.length}
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
