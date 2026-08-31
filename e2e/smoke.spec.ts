import { expect, test } from "@playwright/test";

test("home shows disclaimer and rejects a short agenda", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByText("AI 토론 결과이며 결정은 사람이 합니다.")).toBeVisible();
  await page.locator("#agenda").fill("짧다");
  await expect(page.getByRole("button", { name: "토론 시작" })).toBeDisabled();
  await expect(page.getByText(/안건은 10자 이상/)).toBeVisible();
});

test("home rejects an agenda longer than 200 characters", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("가".repeat(201));
  await expect(page.getByRole("button", { name: "토론 시작" })).toBeDisabled();
  await expect(page.getByText(/안건은 200자 이하/)).toBeVisible();
});

test("session API rejects short and long agendas", async ({ request }) => {
  const short = await request.post("/api/session", {
    data: { agenda: "짧다", category: "marketing" },
  });
  expect(short.status()).toBe(400);
  const long = await request.post("/api/session", {
    data: { agenda: "가".repeat(201), category: "marketing" },
  });
  expect(long.status()).toBe(400);
});

test("precomputed share page is public and shows three provider badges", async ({
  page,
}) => {
  await page.goto("/s/w4demo");
  await expect(page.getByText("AI 토론 결과이며 결정은 사람이 합니다.")).toBeVisible();
  await expect(page.getByText("백내장 검색광고 예산 30% 증액")).toBeVisible();
  await expect(page.getByText("앤트로픽").first()).toBeVisible();
  await expect(page.getByText("오픈AI").first()).toBeVisible();
  await expect(page.getByText("구글").first()).toBeVisible();
  await expect(page.getByText("합의점")).toBeVisible();
  await expect(page.getByText("반대:")).toHaveCount(3);
});

test("saved live memo is public without login", async ({ page, request }) => {
  const api = await request.get("/api/session?id=uE7m2G");
  expect(api.ok()).toBeTruthy();
  const body = await api.json();
  expect(body.session.memo.consensus).toContain(
    "검색광고 증액은 회수 가정이 필요합니다",
  );
  await page.goto("/s/uE7m2G");
  await expect(page.getByText("AI 토론 결과이며 결정은 사람이 합니다.")).toBeVisible();
  await expect(
    page.getByText("검색광고 증액은 회수 가정이 필요합니다"),
  ).toBeVisible();
  await expect(page.getByText("앤트로픽").first()).toBeVisible();
  await expect(page.getByText("오픈AI").first()).toBeVisible();
  await expect(page.getByText("구글").first()).toBeVisible();
  const objections = await page.getByText("반대:").count();
  expect(objections).toBeGreaterThanOrEqual(3);
  await expect(page.locator("input[type=password]")).toHaveCount(0);
});

test("F4 evidence sessions have three non-empty R2 objections", async ({
  page,
  request,
}) => {
  for (const id of ["cA_9I2", "4e4XEM", "NQSmdi"] as const) {
    const res = await request.get(`/api/session?id=${id}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const r2 = (body.turns ?? []).filter(
      (t: { round: number; status: string }) =>
        t.round === 2 && t.status === "ok",
    );
    expect(r2).toHaveLength(3);
    for (const turn of r2) {
      expect(String(turn.payload?.objection ?? "").trim().length).toBeGreaterThan(
        0,
      );
    }
  }
  await page.goto("/s/cA_9I2");
  await expect(page.getByText("AI 토론 결과이며 결정은 사람이 합니다.")).toBeVisible();
  await expect(page.getByText("스마일 전용 레이저 리스 계약 12개월")).toBeVisible();
  await expect(page.getByText("앤트로픽").first()).toBeVisible();
  await expect(page.getByText("오픈AI").first()).toBeVisible();
  await expect(page.getByText("구글").first()).toBeVisible();
  expect(await page.getByText("반대:").count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator("input[type=password]")).toHaveCount(0);
});

test("failed live cells show 발언 불가", async ({ page }) => {
  await page.goto("/s/LNIDoe");
  await expect(page.getByText("발언 불가")).toHaveCount(2);
});

test("round replay on a finished session is 409", async ({ request }) => {
  const res = await request.post("/api/round", {
    data: { sessionId: "uE7m2G", round: 1 },
  });
  expect(res.status()).toBe(409);
  const body = await res.json();
  expect(body.error).toBe("round_already_run");
});

test("round 2 is 422 when round 1 has fewer than two ok cells", async ({
  request,
}) => {
  const res = await request.post("/api/round", {
    data: { sessionId: "LNIDoe", round: 2 },
  });
  expect(res.status()).toBe(422);
  const body = await res.json();
  expect(body.error).toBe("round1_insufficient");
});

test("Du PoLL slide is public", async ({ page }) => {
  await page.goto("/demo/slide");
  await expect(
    page.getByText("세 회사의 모델이 서로 다른 입장을 내고, 결정은 사람이 합니다."),
  ).toBeVisible();
});

test("health endpoint reports booleans only", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(typeof body.anthropic).toBe("boolean");
  expect(typeof body.openai).toBe("boolean");
  expect(typeof body.google).toBe("boolean");
  expect(typeof body.supabase).toBe("boolean");
  expect(body.anthropic).toBe(true);
  expect(body.openai).toBe(true);
  expect(body.google).toBe(true);
  expect(body.supabase).toBe(true);
});

test("uploaded dummy metrics session shows hospital name on share page", async ({
  page,
  request,
}) => {
  const api = await request.get("/api/session?id=dohUks");
  expect(api.ok()).toBeTruthy();
  const body = await api.json();
  expect(body.session.metrics.hospital.name).toBe("업로드안과(가상)");
  await page.goto("/s/dohUks");
  await expect(page.getByText("업로드안과(가상)")).toBeVisible();
  await expect(page.getByText("업로드 더미 지표로 백내장 검색광고 증액을 검토한다")).toBeVisible();
});

test("files page has csv/xlsx upload and dummy links", async ({ page }) => {
  await page.goto("/files");
  await expect(page.getByRole("heading", { name: "파일 관리" })).toBeVisible();
  await expect(page.locator("#metrics-file")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "CSV", exact: true }),
  ).toHaveAttribute("href", "/dummy/patient-and-cashflow.csv");
  await expect(
    page.getByRole("link", { name: "엑셀", exact: true }),
  ).toHaveAttribute("href", "/dummy/patient-and-cashflow.xlsx");
  await expect(page.getByRole("button", { name: "파일 선택" })).toBeVisible();
});

test("home has agenda, the meeting room, and a compact upload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#agenda")).toBeVisible();
  await expect(page.locator("#metrics-file")).toHaveCount(0);
  await expect(page.locator("#home-metrics-file")).toBeVisible();
  await expect(page.getByRole("button", { name: "회의 나가기" })).toBeVisible();
  await expect(page.getByText("Boardroom").first()).toBeVisible();
  await expect(page.getByText("병원 경영 시뮬레이터").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "데이터 검토" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "회의록" })).toBeVisible();
  await expect(page.getByRole("link", { name: "지표 대시보드" })).toBeVisible();
});

test("agenda and category sit below the next-turn header button", async ({
  page,
}) => {
  await page.goto("/");
  const agenda = await page.locator("#agenda").boundingBox();
  const category = await page.locator("#category").boundingBox();
  const start = await page.getByRole("button", { name: "토론 시작" }).boundingBox();
  expect(agenda).toBeTruthy();
  expect(category).toBeTruthy();
  expect(start).toBeTruthy();
  expect(start!.y).toBeLessThan(agenda!.y);
  expect(agenda!.y).toBeLessThan(category!.y);
});

test("home keeps the meeting room with 03 idle bubbles", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-bubble=cfo]")).toBeVisible();
  await expect(page.locator("[data-bubble=mkt]")).toBeVisible();
  await expect(page.locator("[data-bubble=md]")).toBeVisible();
  await expect(page.locator(".char-name")).toHaveCount(0);
  await expect(page.locator("[data-role-chip]")).toHaveCount(3);
  await expect(page.locator("[data-stack=waiting]")).toBeVisible();
  await expect(page.locator("[data-stack=waiting]")).toHaveAttribute(
    "data-sheet-count",
    "1",
  );
  await expect(page.locator("[data-motion=pulse]")).toBeVisible();
  await expect(page.locator("[data-table-prompt=true]")).toBeVisible();
  await expect(page.getByText("자료를 올려 주세요.")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "토론 결과" })).toHaveCount(0);
  await expect(page.locator("[data-glance=true]")).toHaveCount(0);
});

test("agenda panel sits on the left of the meeting room", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const agenda = await page.locator("#agenda").boundingBox();
  const scene = await page.locator(".forest-scene").boundingBox();
  expect(agenda).toBeTruthy();
  expect(scene).toBeTruthy();
  expect(agenda!.x).toBeLessThan(scene!.x + scene!.width / 3);
});

test("file management is a dedicated menu", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "주요 메뉴" });
  await menu.getByRole("link", { name: "파일 관리" }).click();
  await expect(page).toHaveURL(/\/files/);
  await expect(page.getByRole("heading", { name: "파일 관리" })).toBeVisible();
  await expect(page.locator("#metrics-file")).toBeVisible();
});

test("uploading a dummy csv stacks papers on home", async ({ page }) => {
  await page.goto("/files");
  await page
    .locator("#metrics-file")
    .setInputFiles("public/dummy/patient-and-cashflow.csv");
  await expect(page.locator("#upload-stats")).toBeVisible();
  await expect(page.locator("#upload-stats")).toContainText("업로드안과(가상)");
  await expect(page.locator("#upload-stats th", { hasText: "월" })).toBeVisible();
  await page.getByRole("link", { name: "홈에서 토론 시작" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "데이터 검토" })).toBeEnabled();
  await expect(page.locator("[data-stack=stacked]")).toBeVisible();
  await expect(page.locator("[data-stack=stacked]")).toHaveAttribute(
    "data-sheet-count",
    "6",
  );
  await expect(page.locator("[data-motion=stack-up]")).toBeVisible();
  await expect(page.locator("[data-table-prompt=true]")).toHaveCount(0);
  await expect(page.locator("[data-bubble=cfo]")).toBeVisible();
  await expect(page.locator("[data-bubble=mkt]")).toBeVisible();
  await expect(page.locator("[data-bubble=md]")).toBeVisible();
  await expect(page.locator("[data-table-doc]")).toHaveCount(6);
  await expect(page.locator(".char-name")).toHaveCount(0);
});

test("debate results live on a separate menu", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "주요 메뉴" });
  await menu.getByRole("link", { name: "토론 결과" }).click();
  await expect(page).toHaveURL(/\/debate/);
  await expect(page.getByRole("heading", { name: "토론 결과" })).toBeVisible();
  await page.goto("/debate?id=w4demo");
  await expect(page.locator("[data-glance=true]")).toBeVisible();
  await expect(page.getByText("1라운드").first()).toBeVisible();
  await expect(page.getByText("2라운드").first()).toBeVisible();
  await expect(
    page
      .getByText("보류. 검색광고 30% 증액의 회수기간이 12개월 안에 닫히지 않습니다.")
      .first(),
  ).toBeVisible();
  await page.goto("/debate?id=uE7m2G");
  await expect(page.locator("[data-glance=true]")).toBeVisible();
  await expect(page.getByText("1라운드").first()).toBeVisible();
  await expect(page.getByText("2라운드").first()).toBeVisible();
});

test("dashboard decision and settings menus open real pages", async ({
  page,
}) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "주요 메뉴" });
  await menu.getByRole("link", { name: "대시보드" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "대시보드", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "연결 상태" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "비용 대시보드" })).toHaveCount(0);
  await expect(page.getByText("재무이사 (앤트로픽)")).toBeVisible();
  await expect(page.getByText("연결됨").first()).toBeVisible();

  await menu.getByRole("link", { name: "의사결정" }).click();
  await expect(page).toHaveURL(/\/decision/);
  await expect(page.getByRole("heading", { name: "의사결정" })).toBeVisible();
  await expect(page.getByText("사회자 메모")).toBeVisible();

  await menu.getByRole("link", { name: "설정" }).click();
  await expect(page).toHaveURL(/\/settings/);
  await expect(page.getByRole("heading", { name: "설정" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "페르소나 편집" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "비용 대시보드" })).toBeVisible();
  await expect(page.getByText("남은 예산").first()).toBeVisible();
  await expect(page.locator("#persona-name-cfo")).toBeVisible();
  await expect(page.locator("#persona-role-cfo")).toBeVisible();
  await expect(page.locator("#monthly-budget")).toBeVisible();
  await expect(page.getByRole("link", { name: "콘솔" }).first()).toBeVisible();
  await expect(
    page.getByText("페르소나 편집 UI는 MVP 범위 밖입니다"),
  ).toHaveCount(0);
});

test("decision page shows a compact two-round glance for a saved session", async ({
  page,
}) => {
  await page.goto("/decision?id=uE7m2G");
  await expect(page.locator("[data-glance=true]")).toBeVisible();
  await expect(page.getByText("1라운드").first()).toBeVisible();
  await expect(page.getByText("2라운드").first()).toBeVisible();
  await expect(
    page.locator(".glance-note").filter({ hasText: "반대:" }),
  ).toHaveCount(3);
  await expect(
    page.getByText("검색광고 증액은 회수 가정이 필요합니다"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "메모 저장" })).toBeVisible();
});

test("metrics parse accepts dummy csv with cashflow and patient stats", async ({
  request,
}) => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const file = fs.readFileSync(
    path.resolve(process.cwd(), "public/dummy/patient-and-cashflow.csv"),
  );
  const res = await request.post("/api/metrics/parse", {
    multipart: {
      file: {
        name: "patient-and-cashflow.csv",
        mimeType: "text/csv",
        buffer: file,
      },
    },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.hospital).toBe("업로드안과(가상)");
  expect(body.months).toBe(12);
  expect(body.metrics.monthly[0].surgeries.lasik).toBe(99);
  expect(body.metrics.monthly[0].cashflow.in_man).toBeGreaterThan(0);
});

test("keepalive without secret is 401", async ({ request }) => {
  const post = await request.post("/api/keepalive", { data: {} });
  expect(post.status()).toBe(401);
  const get = await request.get("/api/keepalive");
  expect(get.status()).toBe(401);
});

test("usage API reports monthly spend and remaining budget", async ({
  request,
}) => {
  const res = await request.get("/api/usage");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(typeof body.month).toBe("string");
  expect(typeof body.budgetUsd).toBe("number");
  expect(typeof body.spentUsd).toBe("number");
  expect(typeof body.remainingUsd).toBe("number");
  expect(body.byPersona).toHaveLength(3);
  const same = await request.patch("/api/usage", {
    data: { monthlyBudgetUsd: body.budgetUsd },
  });
  expect(same.ok()).toBeTruthy();
});

test("personas API round-trips an edit then restores", async ({ request }) => {
  const get = await request.get("/api/personas");
  expect(get.ok()).toBeTruthy();
  const original = await get.json();
  expect(original.personas).toHaveLength(3);
  const snapshot = original.personas.map(
    (p: {
      key: string;
      name: string;
      role: string;
      habits: string;
      temperature: number;
      provider: string;
    }) => ({
      key: p.key,
      name: p.name,
      role: p.role,
      habits: p.habits,
      temperature: p.temperature,
    }),
  );
  expect(new Set(original.personas.map((p: { provider: string }) => p.provider)).size).toBe(
    3,
  );
  const edited = snapshot.map(
    (p: { key: string; name: string; role: string; habits: string; temperature: number }) =>
      p.key === "cfo" ? { ...p, name: "테스트재무" } : p,
  );
  try {
    const put = await request.put("/api/personas", {
      data: { personas: edited },
    });
    expect(put.ok()).toBeTruthy();
    const after = await (await request.get("/api/personas")).json();
    expect(after.personas.find((p: { key: string }) => p.key === "cfo").name).toBe(
      "테스트재무",
    );
    expect(
      after.personas.find((p: { key: string }) => p.key === "cfo").provider,
    ).toBe("anthropic");
  } finally {
    const restore = await request.put("/api/personas", {
      data: { personas: snapshot },
    });
    expect(restore.ok()).toBeTruthy();
  }
});

test("round stream on a finished session is an SSE error, not a new LLM call", async ({
  request,
}) => {
  const res = await request.post("/api/round/stream", {
    data: { sessionId: "uE7m2G", round: 1 },
  });
  expect(res.headers()["content-type"] ?? "").toContain("text/event-stream");
  const text = await res.text();
  expect(text).toContain("round_already_run");
});
