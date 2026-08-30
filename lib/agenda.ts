import { AGENDA_MAX, AGENDA_MIN } from "@/config/limits";

export const DATA_REVIEW_AGENDA =
  "업로드한 12개월 지표에서 위험·가정·필요 데이터를 올려라";

export function agendaLength(agenda: string): number {
  return agenda.trim().length;
}

export function agendaError(agenda: string): string | null {
  const n = agendaLength(agenda);
  if (n < AGENDA_MIN) {
    return `안건은 ${AGENDA_MIN}자 이상이어야 합니다. (현재 ${n}자)`;
  }
  if (n > AGENDA_MAX) {
    return `안건은 ${AGENDA_MAX}자 이하여야 합니다. (현재 ${n}자)`;
  }
  return null;
}

export function isAgendaValid(agenda: string): boolean {
  return agendaError(agenda) === null;
}

export function canStartDataReview(hasUpload: boolean): boolean {
  return hasUpload;
}
