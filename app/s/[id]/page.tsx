import { PERSONAS } from "@/config/personas";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import type { TurnPayload } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!supabaseConfigured()) {
    return (
      <main className="p-6">
        <p>데이터베이스가 아직 연결되지 않았습니다.</p>
      </main>
    );
  }
  const db = getSupabase();
  const { data: session } = await db
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!session) {
    return (
      <main className="p-6">
        <p>세션을 찾을 수 없습니다.</p>
      </main>
    );
  }
  const { data: turns } = await db
    .from("turns")
    .select("*")
    .eq("session_id", id);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <p className="mb-2 text-sm text-neutral-600">
        AI 토론 결과이며 결정은 사람이 합니다.
      </p>
      <h1 className="mb-2 text-2xl font-semibold">안건</h1>
      <p className="mb-6">{session.agenda}</p>
      <div className="grid grid-cols-3 gap-3">
        {PERSONAS.map((p) => {
          const r1 = turns?.find((t) => t.persona === p.key && t.round === 1);
          const r2 = turns?.find((t) => t.persona === p.key && t.round === 2);
          return (
            <section key={p.key} className="rounded border bg-white p-3">
              <h2 className="mb-2 font-medium">
                {p.name}{" "}
                <span className="text-xs text-neutral-500">{p.provider}</span>
              </h2>
              <TurnBlock label="R1" turn={r1} />
              <TurnBlock label="R2" turn={r2} round2 />
            </section>
          );
        })}
      </div>
      {session.memo ? (
        <pre className="mt-6 overflow-auto rounded bg-neutral-100 p-3 text-xs">
          {JSON.stringify(session.memo, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}

function TurnBlock({
  label,
  turn,
  round2,
}: {
  label: string;
  turn?: {
    status: string;
    payload?: TurnPayload | null;
    error?: string | null;
  };
  round2?: boolean;
}) {
  if (!turn) return <p className="text-sm text-neutral-400">{label}: 없음</p>;
  if (turn.status !== "ok") {
    return <p className="text-sm">{label}: 발언 불가</p>;
  }
  const p = turn.payload;
  if (!p) return null;
  return (
    <div className="mb-3 text-sm">
      <p className="font-semibold">
        {label}. {p.position}
      </p>
      {round2 && p.objection ? <p>반대: {p.objection}</p> : null}
    </div>
  );
}
