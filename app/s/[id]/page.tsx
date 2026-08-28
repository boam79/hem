import { DebateGrid } from "@/components/debate-grid";
import { Disclaimer } from "@/components/disclaimer";
import { MemoView } from "@/components/memo-view";
import demoShare from "@/data/demo-share.json";
import { DEMO_SHARE_ID, type DebateCell } from "@/lib/debate";
import { MemoSchema, type Memo, type TurnPayload } from "@/lib/schema";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type TurnRow = {
  persona: string;
  provider: string;
  round: number;
  status: string;
  payload?: TurnPayload | null;
  error?: string | null;
};

function cellsFor(turns: TurnRow[], round: number): DebateCell[] {
  return turns
    .filter((t) => t.round === round)
    .map((t) => ({
      persona: t.persona,
      provider: t.provider,
      status: t.status,
      payload: t.payload,
      error: t.error,
    }));
}

function ShareBody({
  agenda,
  turns,
  memo,
  extra,
}: {
  agenda: string;
  turns: TurnRow[];
  memo?: Memo | null;
  extra?: string;
}) {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <Disclaimer extra={extra} />
      <h1 className="mb-2 text-2xl font-semibold">안건</h1>
      <p className="mb-6">{agenda}</p>
      <DebateGrid round1={cellsFor(turns, 1)} round2={cellsFor(turns, 2)} />
      {memo ? <MemoView memo={memo} /> : null}
    </main>
  );
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === DEMO_SHARE_ID) {
    const memo = MemoSchema.parse(demoShare.memo);
    return (
      <ShareBody
        agenda={demoShare.agenda}
        turns={demoShare.turns as TurnRow[]}
        memo={memo}
        extra={demoShare.disclaimer}
      />
    );
  }
  if (!supabaseConfigured()) {
    return (
      <main className="p-6">
        <Disclaimer />
        <p>데이터베이스가 아직 연결되지 않았습니다.</p>
        <p className="text-muted-foreground mt-2 text-sm">
          데모 백업은{" "}
          <a className="underline" href={`/s/${DEMO_SHARE_ID}`}>
            /s/{DEMO_SHARE_ID}
          </a>
          에서 볼 수 있습니다.
        </p>
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
        <Disclaimer />
        <p>세션을 찾을 수 없습니다.</p>
      </main>
    );
  }
  const { data: turns } = await db
    .from("turns")
    .select("*")
    .eq("session_id", id);

  const memo = session.memo ? MemoSchema.safeParse(session.memo) : null;

  return (
    <ShareBody
      agenda={session.agenda}
      turns={(turns ?? []) as TurnRow[]}
      memo={memo?.success ? memo.data : null}
    />
  );
}
