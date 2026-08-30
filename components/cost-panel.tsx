"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api-errors";
import {
  formatUsd,
  PROVIDER_USAGE_URL,
  type PersonaUsage,
} from "@/lib/cost";

type UsageResponse = {
  month: string;
  budgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
  byPersona: PersonaUsage[];
  note?: string;
};

export function CostPanel({
  showBudgetEditor = false,
}: {
  showBudgetEditor?: boolean;
}) {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState("10");
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    const res = await fetch("/api/usage");
    const json = await res.json();
    if (!res.ok) {
      setError(apiErrorMessage(json, "사용량을 읽지 못했습니다."));
      return;
    }
    setData(json as UsageResponse);
    setBudget(String((json as UsageResponse).budgetUsd));
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveBudget() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/usage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudgetUsd: Number(budget) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(json));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "예산을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const spentRatio = data
    ? Math.min(100, (data.spentUsd / Math.max(data.budgetUsd, 0.0001)) * 100)
    : 0;

  return (
    <section className="forest-panel">
      <h2 className="forest-panel-title">비용 대시보드</h2>
      <p className="forest-panel-copy">
        {data?.note ??
          "Boardroom 호출의 토큰·추정 비용입니다. 계정 잔액은 각 사 콘솔입니다."}
      </p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {data ? (
        <>
          <p className="cost-month">{data.month} (세계시)</p>
          <div className="cost-summary">
            <span>이번 달 추정 {formatUsd(data.spentUsd)}</span>
            <span>예산 {formatUsd(data.budgetUsd)}</span>
            <span>남은 예산 {formatUsd(data.remainingUsd)}</span>
          </div>
          <div className="cost-bar" aria-hidden>
            <span style={{ width: `${spentRatio}%` }} />
          </div>
          <ul className="cost-persona-rows">
            {data.byPersona.map((row) => (
              <li key={row.key} className="cost-persona-row">
                <span>
                  {row.name ?? row.key} · {row.input + row.output}토큰 ·{" "}
                  {formatUsd(row.usd)}
                </span>
                <a
                  className="forest-dummy-link"
                  href={PROVIDER_USAGE_URL[row.provider] ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  콘솔
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {showBudgetEditor ? (
        <div className="cost-budget-row">
          <label htmlFor="monthly-budget">월 예산(달러)</label>
          <input
            id="monthly-budget"
            type="number"
            min={1}
            max={10000}
            step={1}
            className="forest-agenda-input"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <Button type="button" size="sm" disabled={saving} onClick={saveBudget}>
            {saving ? "저장 중…" : "예산 저장"}
          </Button>
        </div>
      ) : (
        <p className="forest-panel-copy">
          예산은{" "}
          <Link className="forest-dummy-link" href="/settings">
            설정
          </Link>
          에서 바꿉니다.
        </p>
      )}
    </section>
  );
}
