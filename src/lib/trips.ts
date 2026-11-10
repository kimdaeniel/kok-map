import type { Trip } from "./types";

/** "2026-11-14" → "11/14" */
function md(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 여행 날짜를 짧게: "11/14~15", "11/30~12/2", "11/14" (없으면 빈 문자열) */
export function tripDates(t: Pick<Trip, "startDate" | "endDate">): string {
  const { startDate: s, endDate: e } = t;
  if (!s && !e) return "";
  if (s && (!e || e === s)) return md(s);
  if (!s && e) return `~${md(e)}`;
  const [, sm] = s!.split("-");
  const [, em, ed] = e!.split("-");
  return sm === em ? `${md(s!)}~${Number(ed)}` : `${md(s!)}~${md(e!)}`;
}
