"use client";

import type { DragEventHandler, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Check,
  FileSpreadsheet,
  FolderOpen,
  Home,
  LayoutDashboard,
  MessagesSquare,
  Scale,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  forestNavActive,
  timelineStates,
  type ForestNavId,
  type TimelineStepId,
  type TimelineStepState,
  type UploadedMetricsFile,
} from "@/lib/forest-ui";

const NAV: {
  id: ForestNavId;
  label: string;
  href: string;
  Icon: typeof Home;
}[] = [
  { id: "home", label: "홈", href: "/", Icon: Home },
  { id: "debate", label: "토론 결과", href: "/debate", Icon: MessagesSquare },
  { id: "dashboard", label: "대시보드", href: "/dashboard", Icon: LayoutDashboard },
  { id: "files", label: "파일 관리", href: "/files", Icon: FolderOpen },
  { id: "decision", label: "의사결정", href: "/decision", Icon: Scale },
  { id: "settings", label: "설정", href: "/settings", Icon: Settings },
];

const STEPS: {
  id: TimelineStepId;
  label: string;
  date: string;
}[] = [
  { id: "upload", label: "데이터 업로드", date: "24.05.20" },
  { id: "review", label: "데이터 검토", date: "24.05.21" },
  { id: "insight", label: "인사이트 도출", date: "24.05.23" },
  { id: "decision", label: "의사결정", date: "24.05.24" },
  { id: "result", label: "결과 확인", date: "24.05.27" },
];

function MedicalCross() {
  return (
    <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="10" fill="#3DCC8A" />
      <rect x="13" y="6.5" width="6" height="19" rx="1.6" fill="#fff" />
      <rect x="6.5" y="13" width="19" height="6" rx="1.6" fill="#fff" />
    </svg>
  );
}

function DirectorAvatar() {
  return (
    <span className="director-avatar" aria-hidden>
      <svg viewBox="0 0 40 40" className="size-9">
        <circle cx="20" cy="20" r="20" fill="#E8C9A0" />
        <ellipse cx="11" cy="16" rx="5.2" ry="6.4" fill="#C48A5A" />
        <ellipse cx="29" cy="16" rx="5.2" ry="6.4" fill="#C48A5A" />
        <ellipse cx="20" cy="22" rx="11" ry="10" fill="#D9A574" />
        <ellipse cx="20" cy="26" rx="5" ry="3.2" fill="#C48A5A" />
        <circle cx="15.5" cy="20" r="1.5" fill="#3A2414" />
        <circle cx="24.5" cy="20" r="1.5" fill="#3A2414" />
        <path
          d="M16 27c1.4 1.4 6.6 1.4 8 0"
          fill="none"
          stroke="#3A2414"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function ForestNav() {
  const pathname = usePathname();
  return (
    <nav className="forest-nav" aria-label="주요 메뉴">
      {NAV.map((item) => {
        const active = forestNavActive(pathname, item.id);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn("forest-nav-item", active && "is-active")}
            aria-current={active ? "page" : undefined}
          >
            <item.Icon className="size-4" strokeWidth={2.1} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ForestBrand() {
  return (
    <Link href="/" className="forest-brand">
      <MedicalCross />
      <div>
        <p className="forest-brand-title">포레스트 병원</p>
        <p className="forest-brand-sub">의료 경영 시뮬레이션</p>
      </div>
    </Link>
  );
}

function ForestHeaderBar({
  title,
  subtitle,
  roundNumber,
  disclaimer,
}: {
  title: string;
  subtitle: string;
  roundNumber?: 1 | 2;
  disclaimer?: ReactNode;
}) {
  return (
    <header className="forest-header">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="forest-header-title">{title}</h1>
          {roundNumber ? (
            <span className="round-badge">Round {roundNumber}</span>
          ) : null}
        </div>
        <p className="forest-header-sub">{subtitle}</p>
        {disclaimer}
      </div>
      <div className="forest-header-tools">
        <Link href="/dashboard" className="header-ghost-btn">
          <LayoutDashboard className="size-4" />
          대시보드
        </Link>
        <Link href="/dashboard" className="header-bell" aria-label="연결 상태">
          <Bell className="size-4" />
        </Link>
        <div className="director-chip">
          <DirectorAvatar />
          <span>병원장</span>
        </div>
      </div>
    </header>
  );
}

export function ForestFrame({
  title,
  subtitle,
  roundNumber,
  disclaimer,
  sidebar,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  roundNumber?: 1 | 2;
  disclaimer?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="forest-app">
      <aside className="forest-sidebar">
        <ForestBrand />
        <ForestNav />
        {sidebar}
      </aside>
      <div className="forest-main">
        <ForestHeaderBar
          title={title}
          subtitle={subtitle}
          roundNumber={roundNumber}
          disclaimer={disclaimer}
        />
        <div className="forest-workspace">{children}</div>
        {footer}
      </div>
    </div>
  );
}

export function ForestPageNote({ children }: { children: ReactNode }) {
  return <p className="forest-page-note">{children}</p>;
}

export function ForestShell({
  roundNumber,
  disclaimer,
  sidebarLead,
  sidebarExtra,
  footer,
  children,
}: {
  roundNumber: 1 | 2;
  disclaimer: ReactNode;
  sidebarLead: ReactNode;
  sidebarExtra: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <ForestFrame
      title="경영 라운드 회의"
      subtitle="업로드된 데이터를 바탕으로 의사결정을 내려보세요."
      roundNumber={roundNumber}
      disclaimer={disclaimer}
      footer={footer}
      sidebar={null}
    >
      <div className="forest-home-split">
        <section className="forest-upload-column" aria-label="안건">
          {sidebarLead}
          {sidebarExtra}
        </section>
        <div className="forest-scene-column">{children}</div>
      </div>
    </ForestFrame>
  );
}

export function ForestFileList({ files }: { files: UploadedMetricsFile[] }) {
  return (
    <section className="forest-file-list" aria-label="업로드된 파일">
      <div className="forest-file-list-head">
        <h2>업로드된 파일</h2>
        <span className="file-count-badge">{files.length}개</span>
      </div>
      {files.length === 0 ? (
        <p className="forest-file-empty">아직 올린 지표 파일이 없습니다.</p>
      ) : (
        <ul className="forest-file-rows">
          {files.map((file) => (
            <li key={file.id} className="forest-file-row">
              <span className="file-type-icon" data-kind={file.kind}>
                <FileSpreadsheet className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="file-row-name">{file.name}</span>
                <span className="file-row-meta">
                  {file.uploadedAt} · {file.sizeLabel}
                </span>
              </span>
              <Check className="file-row-check" strokeWidth={3} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ForestDropzone({
  children,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  children: ReactNode;
  dragOver: boolean;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDragLeave: DragEventHandler<HTMLDivElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      className={cn("forest-dropzone", dragOver && "is-over")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}

export function ForestTimeline({
  hasUploads,
  loadingRound,
  round1Count,
  round2Count,
  sessionId,
  roundNumber,
}: {
  hasUploads: boolean;
  loadingRound: 0 | 1 | 2;
  round1Count: number;
  round2Count: number;
  sessionId: string | null;
  roundNumber: 1 | 2;
}) {
  const states = timelineStates({
    hasUploads,
    loadingRound,
    round1Count,
    round2Count,
    sessionId,
  });
  return (
    <footer className="forest-footer">
      <div className="forest-footer-meta">
        <p className="forest-footer-round">Round {roundNumber}</p>
        <p className="forest-footer-dates">24.05.20 ~ 24.05.27</p>
        <span className="days-left-badge">7일 남음</span>
      </div>
      <ol className="forest-steps">
        {STEPS.map((step, i) => (
          <li key={step.id} className="forest-step" data-state={states[step.id]}>
            {i > 0 ? <span className="forest-step-line" /> : null}
            <StepGlyph state={states[step.id]} />
            <span className="forest-step-copy">
              <span className="forest-step-label">{step.label}</span>
              <span className="forest-step-date">{step.date}</span>
            </span>
          </li>
        ))}
      </ol>
    </footer>
  );
}

function StepGlyph({ state }: { state: TimelineStepState }) {
  return (
    <span className="forest-step-glyph">
      {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </span>
  );
}
