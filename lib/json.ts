import { jsonrepair } from "jsonrepair";

function normalizeModelJson(text: string): string {
  return text
    .replaceAll("\uFF1A", ":")
    .replace(
      /([,{]\s*"[a-zA-Z_][a-zA-Z0-9_]*")\s+(?=[^:,"{\[\s])/g,
      "$1:",
    );
}

function jsonrepairColon(text: string): string {
  try {
    return jsonrepair(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const m = /Colon expected at position (\d+)/i.exec(msg);
    if (!m) throw err;
    const pos = Number(m[1]);
    if (!Number.isFinite(pos) || pos < 0 || pos > text.length) throw err;
    const ch = text[pos];
    const patched =
      ch === "=" || ch === "\uFF1A"
        ? `${text.slice(0, pos)}:${text.slice(pos + 1)}`
        : `${text.slice(0, pos)}:${text.slice(pos)}`;
    return jsonrepair(patched);
  }
}

function parseOrRepair(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(jsonrepairColon(text));
  }
}

export function extractJsonObject(text: string): unknown {
  const stripped = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = stripped.indexOf("{");
  if (start < 0) {
    throw new Error("no json object in model text");
  }
  const fromBrace = stripped.slice(start);
  const end = fromBrace.lastIndexOf("}");
  const slice = end > 0 ? fromBrace.slice(0, end + 1) : fromBrace;
  try {
    return JSON.parse(slice);
  } catch {
    /* cheap models emit fullwidth colons or omit : before Korean values */
  }
  const lastError = (): never => {
    throw new Error("no json object in model text");
  };
  for (const candidate of [normalizeModelJson(slice), normalizeModelJson(fromBrace)]) {
    try {
      return parseOrRepair(candidate);
    } catch {
      /* try next candidate */
    }
  }
  lastError();
}

export function textFromUnknownError(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const rec = err as { text?: unknown; cause?: { text?: unknown } };
  if (typeof rec.text === "string" && rec.text.includes("{")) {
    return rec.text;
  }
  if (typeof rec.cause?.text === "string" && rec.cause.text.includes("{")) {
    return rec.cause.text;
  }
  return undefined;
}

export function humanizeModelError(message: string): string {
  if (/prepayment credits|insufficient.?credit|quota|billing/i.test(message)) {
    return "모델 크레딧이 부족합니다.";
  }
  if (/could not parse the response/i.test(message)) {
    return "모델이 JSON을 만들지 못했습니다.";
  }
  if (/Invalid schema for response_format/i.test(message)) {
    return "출력 스키마가 모델과 맞지 않습니다.";
  }
  return message.slice(0, 180);
}
