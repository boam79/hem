# 병원 경영회의 시뮬레이터 — PRD v1.0 (개발 착수본)

| 항목 | 내용 |
|---|---|
| 문서 상태 | **v1.0 확정** — 개발 착수 기준 문서 |
| 작성일 | 2026-08-27 |
| 대상 대회 | 원티드 AI Championship 2026 (과제 공개 2026-09-21) |
| 코드명 | Boardroom |
| 변경 이력 | v0.1 초안 → v0.2 사회자 인간화·비용 축소 → v0.3 페르소나 확정 → **v1.0 플랫폼 제약 실측 반영, 라우트 계약·스키마·수용 기준 확정** |

---

## 0. 최종 검토에서 바뀐 것 (v0.3 → v1.0)

| 구분 | v0.3 | v1.0 | 근거 |
|---|---|---|---|
| AI SDK | `generateObject` | **AI SDK 7**, `generateText` + `Output.object()` | v6부터 두 API 통합 |
| Vercel 함수 | 제한 미확인 | Hobby 최대 300초 확인 → 라운드당 병렬 호출 여유 충분. `maxDuration = 60` 명시 | Vercel 문서 |
| Vercel 약관 | 미언급 | Hobby는 비상업 한정. 해커톤 데모 OK, 정식 서비스 시 Pro 이관 | Vercel 문서 |
| Supabase | 무료 티어만 명시 | **7일 비활동 시 자동 일시정지** → GitHub Actions keep-alive 추가 | Supabase 문서 |
| 호출 제한 | Route Handler 메모리 카운터 | 서버리스는 메모리 비영속 → **Supabase 테이블 기반 카운트** | 아키텍처 정합 |
| DB 스키마 | `turns.memo` (라운드 행마다 중복) | `sessions.memo` 로 이동, `rate_limits` 테이블 추가 | 정규화 |
| 모델 ID | "경량 모델" | 후보 ID 명시 + W1 검증 절차 | 각 사 최신 라인업 |
| 지표 파일 | 항목만 | JSON 스키마·샘플 확정 | 페르소나 프롬프트와 정합 |
| 수용 기준 | 없음 | 기능별 AC 추가 | 개발·테스트 기준 |

---

## 1. 제품 정의

병원의 **집계 경영 지표**와 **안건**을 입력하면, 서로 다른 회사의 경량 LLM 3개가 재무이사·마케팅실장·진료원장 페르소나로 **2라운드 토론**하고, **사람 사회자**가 비교 그리드를 보며 의사결정 메모를 작성해 공유하는 웹앱.

**가치 제안 (변경 없음)** — 결정을 대신하지 않는다. 회의 전에 반대 논거·미확인 가정·필요 데이터를 빠짐없이 올린다.

## 2. 근거

| 논문 | 적용 범위 |
|---|---|
| Du et al., *Improving Factuality and Reasoning in Language Models through Multiagent Debate*, arXiv:2305.14325 (ICML 2024) | 독립 초안 → 타 의견 노출 → 수정의 다회전 토론 프로토콜 |
| Verga et al., *Replacing Judges with Juries*, arXiv:2404.18796 (Cohere 2024) | 서로 다른 모델 계열 패널이 모델 내 편향을 줄임 → 페르소나 3개를 3개 계열에 분산. 판정은 사람이 하므로 사회자 분리 조건 자동 충족 |

발표에서 말하지 않을 것: "결론이 더 정확하다", "페르소나가 실제 직군을 재현한다". 두 논문 모두 이를 검증하지 않았다.

## 3. 범위

### 3.1 포함 (MVP)
F1 지표 로드 · F2 안건 입력 · F3 라운드 1 · F4 라운드 2 · F5 비교 그리드 · F6 사람 사회자 메모·공유

### 3.2 제외 (정식 서비스 시)
자동 메모 초안, 라운드 3, 단일 모델 비교 모드, 페르소나 편집 UI, 인증·RLS, 실데이터 업로드, 토큰 스트리밍, 비용 대시보드

## 4. 검증된 플랫폼 제약

| 플랫폼 | 제약 | 대응 |
|---|---|---|
| Vercel Hobby | 함수 최대 300초, 월 100만 호출, **비상업 한정** | `export const maxDuration = 60`. 데모는 비상업. 정식 서비스 전 Pro 이관 |
| Supabase Free | 활성 프로젝트 2개, DB 500MB, **7일 비활동 시 일시정지**, 백업 없음 | GitHub Actions로 주 2회 ping. 데모데이 전날 대시보드에서 상태 확인. 합성 데이터는 저장소에 있으므로 유실 무관 |
| AI SDK 7 | `generateObject` → `generateText({ output: Output.object({schema}) })` | 마이그레이션 가이드 기준으로 작성 |
| Google Gemini | 2.0 Flash / Flash-Lite 2026-06-01 종료 | 3.x Flash-Lite 계열만 사용 |

## 5. 기술 스택 (확정)

| 계층 | 선택 | 비용 |
|---|---|---|
| 프레임워크 | Next.js 15 App Router, TypeScript, pnpm | 0 |
| LLM | `ai@7`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` — 프로바이더 직접 연결 (Gateway 미사용) | 패키지 0 |
| 구조화 출력 | `Output.object` + Zod | 0 |
| DB | Supabase Free (Postgres) — `@supabase/supabase-js`, 서버 전용 service role 키 | 0 |
| 배포 | Vercel Hobby | 0 |
| UI | Tailwind CSS, shadcn/ui (card, badge, textarea, select, button, skeleton) | 0 |
| 자동화 | GitHub Actions (Supabase keep-alive) | 0 |
| 개발 환경 | Windows 11, Node 20 LTS | 0 |

### 5.1 모델 매핑 (후보 ID — W1에서 확정)

| 페르소나 | 계열 | 후보 모델 ID | 확정 절차 |
|---|---|---|---|
| `cfo` | Anthropic | `claude-haiku-4-5-20251001` (확인됨) | 그대로 사용 |
| `mkt` | OpenAI | `gpt-5.4-mini` 또는 `gpt-5.6-luna` | `GET /v1/models`로 ID 확인 후 한국어 JSON 안정성 비교 |
| `md` | Google | `gemini-3.1-flash-lite` 또는 `gemini-3.5-flash-lite` | `models.list`로 ID 확인 후 동일 비교 |

코드 제약: `config/personas.ts`에서 세 페르소나의 `provider`가 모두 달라야 하며, 다르지 않으면 빌드 시 오류를 던진다.

### 5.2 비용 상한
- 호출당 입력 ≤1,500 토큰, 출력 ≤300 토큰 (`maxOutputTokens: 400`)
- 안건 1건 = 6회 호출 ≈ 입력 9k / 출력 1.8k
- 데모·투표 기간 200안건 = 입력 1.8M / 출력 0.36M
- 보수적 단가 $1/$5 (per 1M) 로 계산해도 **$3.6 이하**. 실제 경량 모델 단가는 이보다 낮음
- 각 프로바이더 콘솔에 월 지출 한도 $10 설정

## 6. 아키텍처

```
apps/boardroom (Next.js)
├─ app/
│  ├─ page.tsx                 안건 입력 → 그리드 → 메모 폼
│  ├─ s/[id]/page.tsx          읽기 전용 결과
│  └─ api/
│     ├─ session/route.ts      POST 생성 / GET 조회
│     ├─ round/route.ts        POST { sessionId, round }
│     └─ memo/route.ts         PUT { sessionId, memo }
├─ config/
│  ├─ personas.ts              페르소나·모델·온도·프롬프트
│  └─ limits.ts                호출 제한 값
├─ data/metrics.json           합성 집계 지표
├─ lib/
│  ├─ llm.ts                   프로바이더 팩토리, callPersona()
│  ├─ schema.ts                Zod 스키마 (Turn, Memo, Metrics)
│  ├─ prompt.ts                컨텍스트·라운드별 프롬프트 조립
│  ├─ supabase.ts              서버 클라이언트
│  └─ ratelimit.ts             Supabase 기반 카운트
└─ .github/workflows/keepalive.yml
```

### 6.1 데이터 흐름
1. 클라이언트 `POST /api/session { agenda, category }` → `sessions` 행 생성, `id` 반환
2. 클라이언트 `POST /api/round { sessionId, round: 1 }` → 서버가 `metrics.json` + 안건으로 컨텍스트 조립 → `Promise.allSettled` 3회 → `turns` 3행 저장 → 결과 반환
3. 클라이언트 `POST /api/round { sessionId, round: 2 }` → 라운드 1 `turns` 조회 → 타 발언 주입 → 병렬 3회 → 저장 → 반환
4. 사회자가 폼 작성 → `PUT /api/memo` → `sessions.memo` 저장
5. `/s/[id]` 는 서버 컴포넌트에서 `sessions` + `turns` 조회해 렌더

### 6.2 실패 처리
- 페르소나 단일 실패: `allSettled` 결과 중 rejected 는 `status: 'failed'` 로 저장, 그리드 셀에 "발언 불가" 표시, 나머지 진행
- 스키마 검증 실패: 1회 재시도(temperature 0.2로 낮춤), 재실패 시 `failed`
- 라운드 2는 라운드 1 성공 셀이 2개 이상일 때만 허용

## 7. API 계약

### `POST /api/session`
```json
// req
{ "agenda": "백내장 검색광고 예산 30% 증액", "category": "marketing" }
// res 201
{ "id": "k3f9x2", "createdAt": "..." }
```
`category` ∈ `investment | marketing | staffing | pricing`. `agenda` 10~200자.

### `POST /api/round`
```json
// req
{ "sessionId": "k3f9x2", "round": 1 }
// res 200
{
  "round": 1,
  "turns": [
    { "persona": "cfo", "provider": "anthropic", "model": "...", "status": "ok",
      "payload": { "position": "...", "evidence": ["..."], "risks": ["..."], "needs_data": ["..."] },
      "latencyMs": 4210, "usage": { "input": 1420, "output": 260 } },
    { "persona": "mkt", "status": "failed", "error": "timeout" }
  ]
}
```
오류: `409` 라운드 중복 실행, `422` 라운드 1 성공 셀 <2 인 상태에서 라운드 2 요청, `429` 호출 제한.

### `PUT /api/memo`
```json
{ "sessionId": "k3f9x2",
  "memo": { "consensus": ["..."], "open_issues": [{ "issue": "...", "positions": { "cfo": "...", "mkt": "...", "md": "..." } }],
            "missing_data": ["..."], "options": [{ "option": "...", "supported_by": ["mkt"] }] } }
```

### `GET /api/session?id=`
세션 + turns + memo 반환. 읽기 전용 페이지가 사용.

## 8. DB 스키마 (Supabase SQL)

```sql
create table sessions (
  id          text primary key,              -- nanoid(6)
  agenda      text not null check (char_length(agenda) between 10 and 200),
  category    text not null check (category in ('investment','marketing','staffing','pricing')),
  memo        jsonb,
  created_at  timestamptz default now()
);

create table turns (
  id          bigserial primary key,
  session_id  text references sessions(id) on delete cascade,
  round       smallint not null check (round in (1,2)),
  persona     text not null check (persona in ('cfo','mkt','md')),
  provider    text not null,
  model       text not null,
  status      text not null check (status in ('ok','failed')),
  payload     jsonb,
  error       text,
  usage       jsonb,
  latency_ms  int,
  created_at  timestamptz default now(),
  unique (session_id, round, persona)
);

create table rate_limits (
  key         text primary key,               -- 'ip:1.2.3.4:2026082715' (시간 단위)
  count       int not null default 0,
  updated_at  timestamptz default now()
);

create table keepalive (id int primary key default 1, pinged_at timestamptz);
```
RLS 비활성 (인증 없음, 합성 데이터만). anon 키는 클라이언트에 노출하지 않고 모든 접근을 Route Handler 경유.

## 9. 호출 제한 (`lib/ratelimit.ts`)

| 규칙 | 값 | 구현 |
|---|---|---|
| 세션당 라운드 실행 | 라운드 1·2 각 1회 | `turns` unique 제약 + `409` |
| IP당 세션 생성 | 시간당 10건 | `rate_limits` upsert `count+1`, 초과 시 `429` |
| 전역 일일 세션 | 100건 | `sessions` 당일 count, 초과 시 안내 문구 |

IP는 `x-forwarded-for` 첫 값. 데모데이 당일은 전역 한도를 300으로 상향(환경변수).

## 10. 합성 지표 (`data/metrics.json`)

### 10.1 스키마
```ts
const MetricsSchema = z.object({
  hospital: z.object({ name: z.string(), type: z.string(), doctors: z.number() }),
  period: z.object({ from: z.string(), to: z.string() }),          // 'YYYY-MM'
  monthly: z.array(z.object({
    month: z.string(),
    surgeries: z.object({ lasik: z.number(), smile: z.number(), icl: z.number(), cataract: z.number() }),
    per_doctor_surgeries: z.number(),
    revenue_mix: z.object({ refractive: z.number(), cataract: z.number(), other: z.number() }), // 비율, 합 1
    inflow: z.object({ search_ad: z.number(), social: z.number(), referral: z.number(), overseas_agency: z.number() }),
    nationality_mix: z.object({ domestic: z.number(), china: z.number(), japan: z.number(), other: z.number() }),
    consult_to_surgery_rate: z.number(),
  })),
});
```

### 10.2 생성 규칙
- 12개월(2025-08~2026-07), 병원명 "S안과(가상)", 의사 4명
- 시력교정은 겨울방학·여름방학(1·2·7·8월) 피크, 백내장은 완만한 계절성
- 상담→수술 전환율 0.55~0.70 범위에서 채널 구성에 따라 변동
- 국적별 비중에서 중국·일본이 하반기 상승 추세 (해외환자 논거가 나오도록)
- **실제 병원 수치와의 유사성 없음**을 파일 상단 `_note` 필드에 명시
- 프롬프트에 넣을 때는 서버에서 12행을 표(마크다운)로 변환, 1,000 토큰 이내 확인

### 10.3 샘플 행
```json
{ "month": "2026-07",
  "surgeries": { "lasik": 210, "smile": 340, "icl": 95, "cataract": 180 },
  "per_doctor_surgeries": 206,
  "revenue_mix": { "refractive": 0.62, "cataract": 0.31, "other": 0.07 },
  "inflow": { "search_ad": 820, "social": 460, "referral": 310, "overseas_agency": 140 },
  "nationality_mix": { "domestic": 0.81, "china": 0.10, "japan": 0.06, "other": 0.03 },
  "consult_to_surgery_rate": 0.63 }
```

## 11. 에이전트 설계

### 11.1 페르소나 (확정)

| 키 | 이름 | 우선순위 (순서 고정) | 주 인용 지표 | 계열 | 온도 |
|---|---|---|---|---|---|
| `cfo` | 재무이사 | ① 월 현금흐름 ② 회수기간 12개월 이내 ③ 고정비 억제 | `revenue_mix`, `surgeries`, `inflow` 대비 비용 | Anthropic | 0.4 |
| `mkt` | 마케팅실장 | ① 신환 증가 ② 채널별 획득비용 ③ 국적별 수요 선점 | `inflow`, `nationality_mix`, `consult_to_surgery_rate` | OpenAI | 0.7 |
| `md` | 진료원장 | ① 수술 안전 ② 의사 1인당 부하 상한 ③ 상담 시간 확보 | `per_doctor_surgeries`, `surgeries`, `consult_to_surgery_rate` | Google | 0.5 |

### 11.2 출력 스키마 (`lib/schema.ts`)
```ts
export const TurnSchema = z.object({
  position:   z.string().max(200),
  evidence:   z.array(z.string().max(60)).min(1).max(4),
  risks:      z.array(z.string().max(120)).max(3),
  needs_data: z.array(z.string().max(80)).max(3),
  objection:  z.string().max(200).optional(),   // R2 필수 (프롬프트로 강제, 코드로 검증)
  changed:    z.string().max(120).optional(),   // R2 필수
});
```
라운드 2에서 `objection` 누락 시 스키마 실패로 처리 → 재시도 1회.

### 11.3 프롬프트 (`config/personas.ts`)

```
[BASE_RULES]
당신은 {hospital.name}(강남권 시력교정·백내장 중심 안과, 의사 {doctors}명)의 {역할}입니다.
회의 안건에 대해 당신의 관점에서만 발언합니다.
1. 아래 지표 표에 있는 수치만 인용합니다. 표에 없는 수치는 만들지 않고 needs_data에 적습니다.
2. position은 결론을 먼저, 1~2문장으로 씁니다.
3. evidence에는 인용한 지표명과 월을 적습니다 (예: "inflow.search_ad 2026-07").
4. 다른 부서의 관점을 대변하거나 절충안을 먼저 내지 않습니다.
5. 한국어, 지정 JSON 스키마만 출력합니다.
[ROUND2_RULES]
6. 제공된 타 부서 발언 중 동의하지 않는 지점을 objection에 1개 이상 적고 이유를 붙입니다.
7. changed에 입장 변경 여부를 적습니다. 바뀌었으면 원인을, 아니면 "유지: 이유"를 씁니다.

[cfo]
역할: 재무이사(CFO). 우선순위: ① 월 현금흐름 유지 ② 투자 회수기간 12개월 이내 ③ 고정비 증가 억제
판단 습관: 제안을 "얼마가 들고 언제 회수되는가"로 환산 / 고정비·변동비 구분 / 성수기·비수기 편차 미반영 지적 / 근거 없는 낙관은 risks에 명시

[mkt]
역할: 마케팅실장. 우선순위: ① 신환 수 증가 ② 채널별 획득비용 개선 ③ 국적별 수요 선점
판단 습관: 유입 감소·경쟁 신호를 지표에서 먼저 찾음 / 채널별 유입 기준 투자처 제시 / 국적별 비중 변화를 해외환자 기회로 해석 / 실행 지연의 기회비용을 risks에 명시

[md]
역할: 진료원장(의료진 대표). 우선순위: ① 수술 안전·합병증 관리 ② 의사 1인당 수술 부하 상한 ③ 상담·설명 시간 확보
판단 습관: 물량 증가가 품질·의료진 부담에 미치는 영향을 먼저 봄 / per_doctor_surgeries 기준 수용 가능 여부 판단 / 광고 유입 환자의 기대치 관리와 설명 시간을 risks에 명시 / 품질 지표 부재 시 needs_data에 기재
```

### 11.4 라운드 2 주입 형식
```
[다른 부서의 라운드 1 발언]
- 마케팅실장: position / evidence / risks
- 진료원장: position / evidence / risks
```
발언자 이름만 노출, 모델명 비노출.

### 11.5 호출 구현 (`lib/llm.ts` 골격)
```ts
import { generateText, Output } from 'ai';
export async function callPersona(p: Persona, system: string, user: string) {
  const t0 = Date.now();
  const { output, usage } = await generateText({
    model: p.model,                 // anthropic('...') | openai('...') | google('...')
    system, prompt: user,
    output: Output.object({ schema: TurnSchema }),
    temperature: p.temperature,
    maxOutputTokens: 400,
    abortSignal: AbortSignal.timeout(40_000),
  });
  return { output, usage, latencyMs: Date.now() - t0 };
}
```

## 12. UI

| 화면 | 구성 |
|---|---|
| `/` 상단 | 안건 입력(textarea) + 유형(select) + "토론 시작" |
| `/` 그리드 | 3열(페르소나) × 2행(라운드). 셀: 계열 배지, position 굵게, evidence 칩, risks·needs_data 목록. 라운드 2 셀에 objection·changed 강조 |
| `/` 하단 | 사회자 메모 폼 4항목 + 저장 → 공유 링크 표시 |
| `/s/[id]` | 안건 · 그리드 · 메모 읽기 전용. 상단에 "AI 토론 결과이며 결정은 사람이 합니다" 고지 |
| 로딩 | 셀 단위 skeleton. 라운드 완료 시 일괄 표시 |

## 13. 환경 변수

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=        # 서버 전용, NEXT_PUBLIC 접두어 금지
DAILY_SESSION_CAP=100
KEEPALIVE_SECRET=                 # GitHub Actions → /api/keepalive 인증
```

## 14. 수용 기준 (Acceptance Criteria)

| 기능 | 기준 |
|---|---|
| F1 | 서버 기동 시 `metrics.json`이 `MetricsSchema` 검증 통과. 표 변환 결과 1,000 토큰 이내 |
| F2 | 10자 미만·200자 초과 입력 시 클라이언트·서버 모두 거부 |
| F3 | 라운드 1 요청 → 30초 내 3셀 표시. 1개 실패 시 나머지 2개 표시되고 "발언 불가" 셀 존재 |
| F4 | 라운드 2 모든 성공 셀에 `objection` 비어 있지 않음. 라운드 1 성공 셀 <2 이면 `422` |
| F5 | 셀마다 계열 배지가 서로 다름. 같은 계열 2개 이상이면 빌드 실패 |
| F6 | 메모 저장 후 `/s/[id]` 새로고침 시 동일 내용. 링크는 로그인 없이 열림 |
| 제한 | 같은 세션 라운드 재요청 `409`. IP 시간당 11번째 세션 `429` |
| 운영 | keep-alive 워크플로가 주 2회 성공 로그를 남김 |

## 15. 테스트

- 단위: `schema.ts` 검증, `prompt.ts` 토큰 길이, `ratelimit.ts` 카운트
- 통합: 안건 5종(투자·마케팅·인력·가격·해외환자)으로 라운드 1·2 반복 10회 → objection 충족률, 셀 실패율, 지연 기록
- 페르소나 붕괴 점검: 3셀 position의 문장 유사도 육안 확인. 동일 결론이 3회 이상 나오면 온도·프롬프트 조정
- 데모 리허설: 사회자 메모 작성 3분 이내 3회 연속 달성

## 16. 일정

| 주차 | 기간 | 산출물 | 완료 기준 |
|---|---|---|---|
| W1 | 8/28 – 9/3 | 리포·Vercel·Supabase·GitHub Actions 세팅, 모델 ID 확정, `metrics.json`, `schema.ts`, `personas.ts`, `/api/round` | 3사 호출이 `TurnSchema` 통과 |
| W2 | 9/4 – 9/10 | 그리드 UI, 세션·메모 API, `/s/[id]`, 호출 제한 | AC F1~F6 통과 |
| W3 | 9/11 – 9/17 | 프롬프트 튜닝(안건 5종×10회), 실패 처리, 리허설 | §15 지표 기록 |
| W4 | 9/18 – 9/20 | 발표 자료, 데모 영상 90초, 과제 등록 | 9/21 공개 대비 완료 |

## 17. 데모 시나리오

1. 준비 안건 "백내장 검색광고 예산 30% 증액" → 라운드 1·2 → 사회자(발표자)가 메모 작성 → 링크 공유 (총 4분)
2. 심사위원 즉석 안건 → 라운드 1·2 관전
3. 발표 문구: "세 회사의 모델이 서로 다른 입장을 내고, 결정은 사람이 합니다" + 슬라이드 1장(Du·PoLL)

## 18. 리스크

| 리스크 | 대응 |
|---|---|
| 프로바이더 장애·레이트리밋 | 셀 단위 실패 허용. 데모 1시간 전 3사 헬스체크 스크립트 실행 |
| Supabase 일시정지 | keep-alive + 데모 전날 대시보드 확인. 정지 시 복구 1~2분 |
| 경량 모델의 한국어 JSON 불안정 | W1 비교 후 후보 교체. 재시도 1회 로직 |
| 페르소나 붕괴 | R2 objection 코드 검증, 온도 차등, 우선순위 비중복 |
| 비용 초과·남용 | §9 제한 + 콘솔 월 한도 $10 |
| Vercel 비상업 조항 | 데모·투표 기간은 비상업. 정식 서비스 전 Pro 전환 |
| "프롬프트만 바꾼 것 아니냐" | 배지로 계열 표시 + 빌드 제약 코드 공개 + PoLL 슬라이드 |

## 19. 오픈 이슈 (W1 종료 전 결정)

1. OpenAI·Google 경량 모델 ID 확정 (§5.1)
2. 라운드 2 `objection` 누락 시 재시도 후에도 실패하는 비율이 10% 넘으면 `optional` 유지 + UI 경고로 완화할지 결정
3. 데모데이 전역 세션 한도(100→300) 상향 시점

---
*본 문서는 개발 착수 기준이며, W1 종료 시 §5.1·§19를 갱신해 v1.1로 확정한다.*
