const MESSAGES: Record<string, string> = {
  supabase_unconfigured:
    "데이터베이스가 아직 연결되지 않았습니다. Supabase 환경 변수를 설정해야 합니다.",
  invalid_agenda: "안건 길이나 유형이 올바르지 않습니다.",
  invalid_memo: "메모 항목을 확인하세요.",
  invalid_metrics: "업로드한 지표가 스키마와 맞지 않습니다.",
  invalid_metrics_file: "csv 또는 xlsx 파일을 확인하세요.",
  invalid_request: "요청 형식이 올바르지 않습니다.",
  rate_limited: "같은 주소에서 너무 많이 요청했습니다. 한 시간 뒤에 다시 시도하세요.",
  daily_cap: "오늘 세션 한도에 도달했습니다.",
  round_already_run: "이 세션의 해당 라운드는 이미 실행되었습니다.",
  round1_insufficient:
    "라운드 1 성공 셀이 2개 미만이라 라운드 2를 건너뜁니다.",
  not_found: "세션을 찾을 수 없습니다.",
  round_failed: "라운드를 실행하지 못했습니다.",
  providers_must_differ: "세 페르소나의 프로바이더는 서로 달라야 합니다.",
};

export function apiErrorMessage(
  payload: { error?: string; message?: string },
  fallback = "요청에 실패했습니다.",
): string {
  if (payload.message) return payload.message;
  if (payload.error && MESSAGES[payload.error]) return MESSAGES[payload.error];
  if (payload.error) return payload.error;
  return fallback;
}
