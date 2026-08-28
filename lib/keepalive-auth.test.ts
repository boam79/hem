import { afterEach, describe, expect, it } from "vitest";
import { keepaliveAuthorized } from "@/lib/keepalive-auth";

describe("keepaliveAuthorized", () => {
  const prevSecret = process.env.KEEPALIVE_SECRET;
  const prevCron = process.env.CRON_SECRET;

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.KEEPALIVE_SECRET;
    else process.env.KEEPALIVE_SECRET = prevSecret;
    if (prevCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevCron;
  });

  it("rejects when secrets are unset", () => {
    delete process.env.KEEPALIVE_SECRET;
    delete process.env.CRON_SECRET;
    expect(keepaliveAuthorized(new Headers({ "x-keepalive-secret": "x" }))).toBe(
      false,
    );
  });

  it("accepts matching x-keepalive-secret", () => {
    process.env.KEEPALIVE_SECRET = "test-secret";
    delete process.env.CRON_SECRET;
    expect(
      keepaliveAuthorized(new Headers({ "x-keepalive-secret": "test-secret" })),
    ).toBe(true);
    expect(
      keepaliveAuthorized(new Headers({ "x-keepalive-secret": "wrong" })),
    ).toBe(false);
  });

  it("accepts Vercel cron bearer token", () => {
    delete process.env.KEEPALIVE_SECRET;
    process.env.CRON_SECRET = "cron-token";
    expect(
      keepaliveAuthorized(new Headers({ authorization: "Bearer cron-token" })),
    ).toBe(true);
    expect(
      keepaliveAuthorized(new Headers({ authorization: "Bearer other" })),
    ).toBe(false);
  });
});
