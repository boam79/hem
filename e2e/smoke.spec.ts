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
  await expect(page.getByText("Anthropic").first()).toBeVisible();
  await expect(page.getByText("OpenAI").first()).toBeVisible();
  await expect(page.getByText("Google").first()).toBeVisible();
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
  await expect(page.getByText("Anthropic").first()).toBeVisible();
  await expect(page.getByText("OpenAI").first()).toBeVisible();
  await expect(page.getByText("Google").first()).toBeVisible();
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
  await expect(page.getByText("Anthropic").first()).toBeVisible();
  await expect(page.getByText("OpenAI").first()).toBeVisible();
  await expect(page.getByText("Google").first()).toBeVisible();
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

test("home has csv/xlsx upload and dummy links", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#metrics-file")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "CSV" }),
  ).toHaveAttribute("href", "/dummy/patient-and-cashflow.csv");
  await expect(
    page.getByRole("link", { name: "엑셀" }),
  ).toHaveAttribute("href", "/dummy/patient-and-cashflow.xlsx");
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
