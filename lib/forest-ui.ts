import type { DebateCell } from "@/lib/debate";
import { koreanizePublicText } from "@/lib/ko-display";
import type { PersonaKey } from "@/lib/schema";

export const PAPER_STACK_CAP = 12;
export const BUBBLE_MAX = 80;

export const WAITING_BUBBLE = "자료를 올려 주세요.";
export const LOADING_BUBBLE = "발언 준비 중…";

export const IDLE_BUBBLES: Record<PersonaKey, string> = {
  cfo: "외래가 8% 줄었습니다. 비용 구조부터 봅시다.",
  mkt: "세분 캠페인과 디지털 인지도를 제안합니다.",
  md: "새 과는 경험이 좋아지지만 인력·장비가 먼저입니다.",
};

export const UPLOAD_BUBBLES: Record<PersonaKey, string> = {
  cfo: "업로드 완료! 재무 데이터를 확인했어요.",
  mkt: "마케팅 성과 데이터도 분석할 준비 됐어요!",
  md: "환자 데이터를 바탕으로 서비스 개선 방안을 논의해 볼까요?",
};

export type UploadedMetricsFile = {
  id: string;
  name: string;
  uploadedAt: string;
  sizeLabel: string;
  kind: "csv" | "xlsx";
};

export function sheetCountFromUploads(fileCount: number): number {
  if (fileCount <= 0) return 0;
  return Math.min(PAPER_STACK_CAP, 4 + fileCount * 2);
}

export function paperStackMode(opts: {
  fileCount: number;
  loadingRound: 0 | 1 | 2;
  round1Count: number;
}): "waiting" | "stacked" {
  if (opts.fileCount > 0 || opts.loadingRound !== 0 || opts.round1Count > 0) {
    return "stacked";
  }
  return "waiting";
}

export function sheetCountFromActivity(
  fileCount: number,
  stacked: boolean,
): number {
  if (!stacked) return 1;
  if (fileCount > 0) return sheetCountFromUploads(fileCount);
  return sheetCountFromUploads(1);
}

export function sheetOpacity(
  index: number,
  total: number,
  waiting: boolean,
): number {
  if (waiting || total <= 1 || index === 0) return 1;
  return 0.82 + (index / (total - 1)) * 0.18;
}

export function stackMotion(waiting: boolean): "pulse" | "stack-up" {
  return waiting ? "pulse" : "stack-up";
}

export function stackUpDurationMs(sheetCount: number): number {
  return 280 + Math.max(sheetCount, 1) * 90;
}

export function truncateBubble(text: string, max = BUBBLE_MAX): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export const GLANCE_POSITION_MAX = 72;
export const GLANCE_NOTE_MAX = 56;

export function glanceLine(cell?: DebateCell): string {
  if (!cell) return "대기";
  if (cell.status !== "ok") return "발언 불가";
  return truncateBubble(
    koreanizePublicText(cell.payload?.position ?? ""),
    GLANCE_POSITION_MAX,
  );
}

export function glanceNote(text: string | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return truncateBubble(koreanizePublicText(trimmed), GLANCE_NOTE_MAX);
}

export type ForestNavId =
  | "home"
  | "debate"
  | "dashboard"
  | "files"
  | "decision"
  | "settings";

export function forestNavActive(
  pathname: string,
  id: ForestNavId,
): boolean {
  switch (id) {
    case "home":
      return pathname === "/";
    case "debate":
      return pathname === "/debate";
    case "files":
      return pathname === "/files";
    case "dashboard":
      return pathname === "/dashboard";
    case "decision":
      return pathname === "/decision";
    case "settings":
      return pathname === "/settings";
  }
}

export function fileKind(name: string): "csv" | "xlsx" {
  return name.toLowerCase().endsWith(".csv") ? "csv" : "xlsx";
}

export const DUMMY_METRICS_HREFS = [
  "/dummy/patient-and-cashflow.csv",
  "/dummy/patient-and-cashflow.xlsx",
  "/dummy/hospital-patients-full.csv",
  "/dummy/hospital-patients-full.xlsx",
  "/dummy/hospital-patients-visits.csv",
] as const;

export function downloadDummyMetricsFiles(): void {
  if (typeof document === "undefined") return;
  for (const href of DUMMY_METRICS_HREFS) {
    const a = document.createElement("a");
    a.href = href;
    a.download = href.split("/").pop() ?? "metrics";
    a.click();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return kb >= 10 ? `${Math.round(kb)}KB` : `${kb.toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatShortDate(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

export function latestPosition(
  persona: PersonaKey,
  round1: DebateCell[],
  round2: DebateCell[],
): string | undefined {
  const from = (cells: DebateCell[]) =>
    cells.find((cell) => cell.persona === persona)?.payload?.position?.trim();
  const text = from(round2) || from(round1);
  return text ? koreanizePublicText(text) : undefined;
}

export function spokenFromStream(streamPreview?: string): string | undefined {
  const raw = streamPreview?.trim();
  if (!raw) return undefined;
  if (!raw.startsWith("{")) return koreanizePublicText(raw);
  const match = raw.match(/"position"\s*:\s*"((?:\\.|[^"\\])*)/);
  if (!match?.[1]) return undefined;
  const spoken = match[1].replace(/\\n/g, " ").replace(/\\"/g, '"').trim();
  return spoken ? koreanizePublicText(spoken) : undefined;
}

export function showTableWaitingPrompt(opts: {
  hasUploads: boolean;
  loadingRound: 0 | 1 | 2;
  round1: DebateCell[];
  round2: DebateCell[];
}): boolean {
  return (
    opts.loadingRound === 0 &&
    !opts.hasUploads &&
    opts.round1.length === 0 &&
    opts.round2.length === 0
  );
}

export function shouldShowPersonaBubble(opts: {
  persona: PersonaKey;
  hasUploads: boolean;
  loadingRound: 0 | 1 | 2;
  round1: DebateCell[];
  round2: DebateCell[];
  streamPreview?: string;
}): boolean {
  void opts;
  return true;
}

export function personaBubbleText(opts: {
  persona: PersonaKey;
  hasUploads: boolean;
  loadingRound: 0 | 1 | 2;
  round1: DebateCell[];
  round2: DebateCell[];
  streamPreview?: string;
}): string {
  const { persona, hasUploads, loadingRound, round1, round2, streamPreview } =
    opts;
  const spoken = spokenFromStream(streamPreview);
  if (loadingRound !== 0 && spoken) {
    return truncateBubble(spoken);
  }
  if (loadingRound === 1) return LOADING_BUBBLE;
  const position = latestPosition(persona, round1, round2);
  if (position) return truncateBubble(position);
  if (loadingRound === 2) return LOADING_BUBBLE;
  if (hasUploads) return UPLOAD_BUBBLES[persona];
  return IDLE_BUBBLES[persona];
}

export type TimelineStepId =
  | "upload"
  | "review"
  | "insight"
  | "decision"
  | "result";

export type TimelineStepState = "todo" | "active" | "done";

export function timelineStates(opts: {
  hasUploads: boolean;
  loadingRound: 0 | 1 | 2;
  round1Count: number;
  round2Count: number;
  sessionId: string | null;
}): Record<TimelineStepId, TimelineStepState> {
  const { hasUploads, loadingRound, round1Count, round2Count, sessionId } =
    opts;
  const round1Done = round1Count > 0 && loadingRound !== 1;
  const round2Done = round2Count > 0 && loadingRound !== 2;
  const debateIdleDone = Boolean(sessionId) && loadingRound === 0 && round2Done;

  return {
    upload: hasUploads ? "done" : "active",
    review: round1Done
      ? "done"
      : loadingRound === 1 || (hasUploads && round1Count === 0)
        ? "active"
        : "todo",
    insight: round2Done ? "done" : loadingRound === 2 ? "active" : "todo",
    decision: debateIdleDone ? "active" : "todo",
    result: debateIdleDone ? "done" : sessionId ? "active" : "todo",
  };
}
