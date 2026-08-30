import { Disclaimer } from "@/components/disclaimer";

export const metadata = {
  title: "Boardroom — Du · PoLL",
};

export default function SlidePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center p-8">
      <Disclaimer />
      <p className="mb-6 text-2xl font-semibold leading-snug">
        세 회사의 모델이 서로 다른 입장을 내고, 결정은 사람이 합니다.
      </p>
      <section className="space-y-4 text-sm leading-relaxed">
        <p>
          <strong>Du</strong> — 독립 초안 뒤에 타 의견을 보여 주고 수정합니다.
          합의 점수를 만들지 않습니다.
        </p>
        <p>
          <strong>PoLL</strong> — 패널은 앤트로픽·오픈AI·구글입니다. 배심이
          승자를 고르지 않고, 사람이 메모로 선택지를 남깁니다.
        </p>
        <p className="text-muted-foreground">
          말하지 않을 것: 결론이 더 정확하다, 페르소나가 실제 직군을 재현한다.
        </p>
      </section>
      <pre className="bg-muted mt-8 overflow-x-auto rounded-lg p-4 text-xs">
{`지표 + 안건
  → [앤트로픽 재무] [오픈AI 마케팅] [구글 진료]
  → 비교 그리드
  → 사람 사회자 메모 → /s/[id]`}
      </pre>
    </main>
  );
}
