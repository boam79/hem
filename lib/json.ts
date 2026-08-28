export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("no json object in model text");
  }
  return JSON.parse(text.slice(start, end + 1));
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
