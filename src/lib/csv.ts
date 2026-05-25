import Papa from "papaparse";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { calcWorkMinutes, calcTotalBreakMinutes, calcOvertimeMinutes, formatMinutes } from "@/lib/calculations";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[]; standardWorkMinutes?: number | null };

export function generateCsv(records: RecordWithBreaks[]): string {
  const rows = records.map((r) => {
    const date = format(new Date(r.date), "yyyy/MM/dd", { locale: ja });
    const dayOfWeek = format(new Date(r.date), "E", { locale: ja });
    const clockIn = r.clockInAt ? format(new Date(r.clockInAt), "HH:mm") : "";
    const clockOut = r.clockOutAt ? format(new Date(r.clockOutAt), "HH:mm") : "";
    const breakMin = calcTotalBreakMinutes(r.breakRecords);
    const workMin =
      r.clockInAt && r.clockOutAt
        ? calcWorkMinutes(r.clockInAt, r.clockOutAt, r.breakRecords)
        : 0;
    const overtimeStr =
      r.standardWorkMinutes == null
        ? ""
        : (() => {
            const ot = calcOvertimeMinutes(workMin, r.standardWorkMinutes);
            return ot > 0 ? formatMinutes(ot) : "";
          })();

    return {
      日付: date,
      曜日: dayOfWeek,
      出勤時刻: clockIn,
      退勤時刻: clockOut,
      休憩時間: breakMin > 0 ? formatMinutes(breakMin) : "",
      実労働時間: workMin > 0 ? formatMinutes(workMin) : "",
      残業時間: overtimeStr,
      備考: r.note ?? "",
    };
  });

  // UTF-8 BOM付き（Excel対応）
  return "﻿" + Papa.unparse(rows);
}

