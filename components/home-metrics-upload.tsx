"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Check, CloudUpload, FileSpreadsheet } from "lucide-react";
import { ForestDropzone } from "@/components/forest-shell";
import {
  fileKind,
  formatBytes,
  formatShortDate,
  type UploadedMetricsFile,
} from "@/lib/forest-ui";
import { parseUploadedMetrics } from "@/lib/metrics-stats";
import {
  saveMetricsUploadStore,
  type MetricsUploadStore,
} from "@/lib/metrics-upload-store";
import { parseMetricsUploadFile } from "@/lib/parse-metrics-client";
import type { Metrics } from "@/lib/schema";

export function HomeMetricsUpload({
  files,
  onStore,
}: {
  files: UploadedMetricsFile[];
  onStore: (store: MetricsUploadStore, metrics: Metrics | null) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latest = files.at(-1);

  async function parseFile(file: File) {
    setError(null);
    try {
      const json = await parseMetricsUploadFile(file);
      const nextFile: UploadedMetricsFile = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        uploadedAt: formatShortDate(),
        sizeLabel: formatBytes(file.size),
        kind: fileKind(file.name),
      };
      const label = `${json.hospital} · ${json.months}개월 (업로드)`;
      const nextFiles = [...files, nextFile];
      const store: MetricsUploadStore = {
        metrics: json.metrics,
        label,
        files: nextFiles,
      };
      saveMetricsUploadStore(store);
      onStore(store, parseUploadedMetrics(json.metrics));
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 읽지 못했습니다.");
    }
  }

  return (
    <section className="forest-agenda home-upload-card">
      <p className="forest-field-label">지표 업로드</p>
      <p className="forest-field-hint forest-field-lead">
        병원 주요 지표 파일을 업로드하세요.
      </p>
      {latest ? (
        <p className="home-upload-file">
          <FileSpreadsheet className="size-4" />
          <span className="min-w-0 flex-1 truncate">{latest.name}</span>
          <span className="home-upload-meta">{latest.sizeLabel}</span>
          <Check className="file-row-check" strokeWidth={3} />
        </p>
      ) : null}
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
          const dropped = [...e.dataTransfer.files].filter((file) =>
            /\.(csv|xlsx)$/i.test(file.name),
          );
          if (dropped.length === 0) {
            setError("CSV, XLSX 파일만 지원됩니다.");
            return;
          }
          void (async () => {
            for (const file of dropped) {
              await parseFile(file);
            }
          })();
        }}
      >
        <input
          ref={fileInputRef}
          id="home-metrics-file"
          type="file"
          accept=".csv,.xlsx"
          aria-label="경영 지표 파일"
          className="metrics-file-hit"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void parseFile(file).finally(() => {
              e.target.value = "";
            });
          }}
        />
        <CloudUpload className="dropzone-cloud" strokeWidth={1.75} />
        <p className="dropzone-lead">엑셀, CSV 파일을 드래그하세요</p>
        <button
          type="button"
          className="file-pick-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          파일 선택
        </button>
      </ForestDropzone>
      {error ? (
        <p className="text-destructive mt-2 text-xs">{error}</p>
      ) : null}
      <p className="forest-tip">
        올린 파일에 맞춰 테이블 위 자료가 바뀝니다. 원본은 서버에 저장하지 않습니다.{" "}
        <a className="forest-dummy-link" href="/files">
          파일 관리
        </a>
      </p>
    </section>
  );
}
