"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { CloudUpload } from "lucide-react";
import {
  ForestDropzone,
  ForestFileList,
  ForestFrame,
  ForestPageNote,
} from "@/components/forest-shell";
import { apiErrorMessage } from "@/lib/api-errors";
import {
  downloadDummyMetricsFiles,
  fileKind,
  formatBytes,
  formatShortDate,
  type UploadedMetricsFile,
} from "@/lib/forest-ui";
import {
  readMetricsUploadStore,
  saveMetricsUploadStore,
} from "@/lib/metrics-upload-store";

export default function FilesPage() {
  const [uploads, setUploads] = useState<UploadedMetricsFile[]>([]);
  const [metricsLabel, setMetricsLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = readMetricsUploadStore();
    if (!stored) return;
    setUploads(stored.files);
    setMetricsLabel(stored.label);
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
    const nextFile: UploadedMetricsFile = {
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      uploadedAt: formatShortDate(),
      sizeLabel: formatBytes(file.size),
      kind: fileKind(file.name),
    };
    const label = `${json.hospital} · ${json.months}개월 (업로드)`;
    setUploads((prev) => {
      const files = [...prev, nextFile];
      saveMetricsUploadStore({
        metrics: json.metrics,
        label,
        files,
      });
      return files;
    });
    setMetricsLabel(label);
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void parseMetricsFile(file).finally(() => {
      e.target.value = "";
    });
  }

  return (
    <ForestFrame
      title="파일 관리"
      subtitle="CSV·XLSX 지표를 올리면 홈 토론이 그 숫자를 씁니다. 원본 파일은 서버에 저장하지 않습니다."
      sidebar={
        <ForestPageNote>
          홈과 다른 화면입니다. 마지막에 성공한 파싱만 토론에 실립니다.
        </ForestPageNote>
      }
    >
      <section className="forest-panel" id="upload">
        <h2 className="forest-panel-title">파일 업로드</h2>
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
            onChange={onFileInputChange}
          />
          <CloudUpload className="dropzone-cloud" strokeWidth={1.75} />
          <p className="dropzone-lead">파일을 드래그하거나</p>
          <button
            type="button"
            className="file-pick-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            파일 선택
          </button>
          <p className="dropzone-hint">CSV, XLSX 파일만 지원됩니다.</p>
        </ForestDropzone>
        {error ? (
          <p className="text-destructive mt-2 text-xs">{error}</p>
        ) : null}
        <p className="forest-panel-copy mt-3">
          {metricsLabel ? metricsLabel : "없으면 홈은 기본 합성 지표를 씁니다."}{" "}
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
        <ForestFileList files={uploads} />
        <button
          type="button"
          className="download-all-btn"
          onClick={() => downloadDummyMetricsFiles()}
        >
          모든 파일 다운로드
        </button>
        <p className="forest-panel-copy mt-3">
          <Link className="forest-dummy-link" href="/">
            홈에서 토론 시작
          </Link>
        </p>
      </section>
    </ForestFrame>
  );
}
