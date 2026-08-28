import { AGENDA_MAX, AGENDA_MIN } from "@/config/limits";

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
