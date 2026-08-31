"use client";

import type { Metrics } from "@/lib/schema";
import {
  tableDocumentsFromMetrics,
  type TableDocument,
} from "@/lib/table-charts";

const PIE_COLORS = ["#2563eb", "#fb7185", "#14b8a6", "#f59e0b"];

function maxOf(values: number[]): number {
  return Math.max(...values, 1);
}

function BarChart({ values }: { values: number[] }) {
  const max = maxOf(values);
  const width = 160;
  const height = 64;
  const gap = 4;
  const barW = (width - gap * (values.length + 1)) / values.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="table-doc-svg" aria-hidden>
      {values.map((value, i) => {
        const h = (value / max) * (height - 6);
        return (
          <rect
            key={i}
            x={gap + i * (barW + gap)}
            y={height - h}
            width={barW}
            height={h}
            rx={2.5}
            fill={i === values.length - 1 ? "#1e3a8a" : "#60a5fa"}
          />
        );
      })}
    </svg>
  );
}

function piePath(start: number, fraction: number, cx = 32, cy = 32, r = 28): string {
  const a0 = start * Math.PI * 2 - Math.PI / 2;
  const a1 = (start + fraction) * Math.PI * 2 - Math.PI / 2;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = fraction > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

function PieChart({ values }: { values: number[] }) {
  const total = values.reduce((sum, n) => sum + n, 0) || 1;
  let cursor = 0;
  return (
    <svg viewBox="0 0 64 64" className="table-doc-svg table-doc-pie" aria-hidden>
      {values.map((value, i) => {
        const fraction = value / total;
        const d = piePath(cursor, fraction);
        cursor += fraction;
        return <path key={i} d={d} fill={PIE_COLORS[i % PIE_COLORS.length]} />;
      })}
    </svg>
  );
}

function LineChart({ values }: { values: number[] }) {
  const max = maxOf(values);
  const width = 160;
  const height = 64;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((value, i) => {
      const x = i * step;
      const y = height - (value / max) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="table-doc-svg" aria-hidden>
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function GridMini({ rows }: { rows: { label: string; value: number }[] }) {
  return (
    <table className="table-doc-grid">
      <tbody>
        {rows.slice(0, 4).map((row) => (
          <tr key={row.label}>
            <th>{row.label}</th>
            <td>{Number.isInteger(row.value) ? row.value : `${Math.round(row.value * 100)}%`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NoteMini({ lines }: { lines: string[] }) {
  return (
    <ul className="table-doc-note">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function ChartBody({ doc }: { doc: TableDocument }) {
  switch (doc.kind) {
    case "bar":
      return <BarChart values={doc.values} />;
    case "pie":
      return <PieChart values={doc.slices.map((slice) => slice.value)} />;
    case "line":
      return <LineChart values={doc.values} />;
    case "grid":
      return <GridMini rows={doc.rows} />;
    case "note":
      return <NoteMini lines={doc.lines} />;
  }
}

export function TableDocs({ metrics }: { metrics: Metrics }) {
  const docs = tableDocumentsFromMetrics(metrics);
  return (
    <div className="table-docs" data-table-docs="true">
      {docs.map((doc) => (
        <article
          key={doc.id}
          className="table-doc"
          data-table-doc={doc.id}
        >
          <h3>{doc.title}</h3>
          <ChartBody doc={doc} />
        </article>
      ))}
    </div>
  );
}
