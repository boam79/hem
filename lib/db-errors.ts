export const DB_UNAVAILABLE_MESSAGE =
  "데이터베이스가 일시 중지되어 회의에 연결하지 못했습니다. 잠시 후 다시 시도하세요.";

export function isDbNetworkError(err: unknown): boolean {
  const msg =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : String(err ?? "");
  return /fetch failed|Failed to fetch|ECONNRESET|ENOTFOUND|ETIMEDOUT|UND_ERR|other side closed/i.test(
    msg,
  );
}

export function dbUnavailableResponse(): Response {
  return Response.json(
    { error: "db_unavailable", message: DB_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

export function jsonFromSupabaseError(error: { message?: string }): Response {
  if (isDbNetworkError(error.message)) return dbUnavailableResponse();
  return Response.json(
    { error: error.message || "db_error" },
    { status: 500 },
  );
}

export function jsonFromCaught(err: unknown): Response {
  if (isDbNetworkError(err)) return dbUnavailableResponse();
  const message = err instanceof Error ? err.message : String(err);
  if (isDbNetworkError(message)) return dbUnavailableResponse();
  return Response.json({ error: message }, { status: 500 });
}
