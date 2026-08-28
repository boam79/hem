import { expect, test } from "@playwright/test";

test("home shows disclaimer and rejects a short agenda", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByText("AI 토론 결과이며 결정은 사람이 합니다.")).toBeVisible();
  await page.locator("#agenda").fill("짧다");
  await expect(page.getByRole("button", { name: "토론 시작" })).toBeDisabled();
  await expect(page.getByText(/안건은 10자 이상/)).toBeVisible();
});

test("precomputed share page is public and shows three provider badges", async ({
  page,
}) => {
  await page.goto("/s/w4demo");
  await expect(page.getByText("AI 토론 결과이며 결정은 사람이 합니다.")).toBeVisible();
  await expect(page.getByText("백내장 검색광고 예산 30% 증액")).toBeVisible();
  await expect(page.getByText("Anthropic")).toBeVisible();
  await expect(page.getByText("OpenAI")).toBeVisible();
  await expect(page.getByText("Google")).toBeVisible();
  await expect(page.getByText("합의점")).toBeVisible();
  await expect(page.getByText("반대:")).toHaveCount(3);
});

test("Du PoLL slide is public", async ({ page }) => {
  await page.goto("/demo/slide");
  await expect(
    page.getByText("세 회사의 모델이 서로 다른 입장을 내고, 결정은 사람이 합니다."),
  ).toBeVisible();
});

test("debate start without database shows a Korean error", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "토론 시작" }).click();
  await expect(
    page.getByText("데이터베이스가 아직 연결되지 않았습니다"),
  ).toBeVisible();
});

test("home header and demo replay show the backup grid", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "데모 공유" })).toBeVisible();
  await expect(page.getByRole("link", { name: "발표 슬라이드" })).toBeVisible();
  await page.getByRole("button", { name: "데모 재생" }).click();
  await expect(page.getByText("Anthropic")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("OpenAI")).toBeVisible();
  await expect(page.getByText("Google")).toBeVisible();
  await expect(page.getByText("반대:")).toHaveCount(3);
  await expect(page.getByText("사전 계산된 데모 백업입니다")).toBeVisible();
  await expect(page.getByText("합의점")).toBeVisible();
});

test("health endpoint reports booleans only", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(typeof body.anthropic).toBe("boolean");
  expect(typeof body.openai).toBe("boolean");
  expect(typeof body.google).toBe("boolean");
  expect(typeof body.supabase).toBe("boolean");
});
