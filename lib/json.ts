import { jsonrepair } from "jsonrepair";

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
    const repaired = jsonrepair(fromBrace);
    return JSON.parse(repaired);
  }
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
