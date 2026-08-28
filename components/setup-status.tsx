"use client";

import { useEffect, useState } from "react";
import { isLiveDebateReady, type HealthStatus } from "@/lib/health";

export function SetupStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((res) => res.json())
      .then((body: HealthStatus) => {
        if (!cancelled) setHealth(body);
      })
      .catch(() => {
        if (!cancelled) {
          setHealth({
            anthropic: false,
            openai: false,
            google: false,
            supabase: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) {
    return (
      <p className="text-muted-foreground mb-4 text-sm" aria-live="polite">
        연결 상태를 확인하는 중…
      </p>
    );
  }

  if (isLiveDebateReady(health)) {
    return (
      <p className="mb-4 text-sm" aria-live="polite">
        실토론 준비됨. 안건을 넣고 토론 시작을 누르면 세 모델이 발언합니다.
      </p>
    );
  }

  return (
    <div
      className="bg-muted mb-4 rounded-lg px-3 py-2 text-sm"
      aria-live="polite"
    >
      <p className="font-medium">실토론은 아직 키가 연결되지 않았습니다.</p>
      <p className="text-muted-foreground mt-1">
        발표는 <strong>데모 재생</strong>으로 진행하세요. Anthropic{" "}
        {health.anthropic ? "연결" : "없음"} · OpenAI{" "}
        {health.openai ? "연결" : "없음"} · Google{" "}
        {health.google ? "연결" : "없음"} · DB{" "}
        {health.supabase ? "연결" : "없음"}.
      </p>
    </div>
  );
}
