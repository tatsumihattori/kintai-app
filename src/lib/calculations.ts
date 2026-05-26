import type { BreakRecord } from "@/lib/db-types";

export function calcTotalBreakMinutes(breaks: BreakRecord[]): number {
  return breaks.reduce((total, b) => {
    if (!b.breakEndAt) return total;
    const ms = new Date(b.breakEndAt).getTime() - new Date(b.breakStartAt).getTime();
    return total + Math.floor(ms / 60000);
  }, 0);
}

export function calcAutoBreakMinutes(workableMinutes: number): number {
  if (workableMinutes >= 480) return 60;
  if (workableMinutes >= 360) return 45;
  return 0;
}

export function calcWorkMinutes(
  clockInAt: Date,
  clockOutAt: Date,
  breaks: BreakRecord[]
): number {
  const totalMs = new Date(clockOutAt).getTime() - new Date(clockInAt).getTime();
  const totalMinutes = Math.floor(totalMs / 60000);
  const nakanukeMinutes = calcTotalBreakMinutes(breaks);
  const workableMinutes = Math.max(0, totalMinutes - nakanukeMinutes);
  return Math.max(0, workableMinutes - calcAutoBreakMinutes(workableMinutes));
}

export function calcOvertimeMinutes(
  workMinutes: number,
  standardWorkMinutes: number
): number {
  return Math.max(0, workMinutes - standardWorkMinutes);
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${m > 0 ? `${m}分` : ""}`;
}

export function deriveStandardWorkMinutes(
  shift: { startTime: number | null; endTime: number | null; breakMinutes: number } | null | undefined
): number | null {
  if (shift === null || shift === undefined) return null;
  if (shift.startTime === null || shift.endTime === null) return 0;
  return (shift.endTime - shift.startTime) - shift.breakMinutes;
}

