"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";
import { calcWorkMinutes, calcTotalBreakMinutes, calcOvertimeMinutes, formatMinutes } from "@/lib/calculations";
import { EditRecordModal } from "@/components/attendance/EditRecordModal";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[]; standardWorkMinutes?: number | null };

interface Props {
  records: RecordWithBreaks[];
  onUpdate: (record: RecordWithBreaks) => void;
}

export function AttendanceTable({ records, onUpdate }: Props) {
  const [editTarget, setEditTarget] = useState<RecordWithBreaks | null>(null);

  if (records.length === 0) {
    return <p className="text-center text-gray-400 py-8">記録がありません</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500 text-left">
              <th className="py-2 pr-3 font-medium">日付</th>
              <th className="py-2 pr-3 font-medium">出勤</th>
              <th className="py-2 pr-3 font-medium">退勤</th>
              <th className="py-2 pr-3 font-medium">中抜け</th>
              <th className="py-2 pr-3 font-medium">実労働</th>
              <th className="py-2 pr-3 font-medium">残業</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const date = new Date(r.date);
              const dayOfWeek = format(date, "E", { locale: ja });
              const isSat = date.getDay() === 6;
              const isSun = date.getDay() === 0;
              const breakMin = calcTotalBreakMinutes(r.breakRecords);
              const workMin = r.clockOutAt
                ? calcWorkMinutes(r.clockInAt, r.clockOutAt, r.breakRecords)
                : null;
              const overtimeMin =
                workMin !== null && r.standardWorkMinutes != null
                  ? calcOvertimeMinutes(workMin, r.standardWorkMinutes)
                  : null;

              return (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <span className={isSun ? "text-red-500" : isSat ? "text-blue-500" : ""}>
                      {format(date, "d日")}（{dayOfWeek}）
                    </span>
                    {r.isEdited && (
                      <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1 rounded">修正済</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {format(new Date(r.clockInAt), "HH:mm")}
                  </td>
                  <td className="py-2 pr-3">
                    {r.clockOutAt ? format(new Date(r.clockOutAt), "HH:mm") : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {breakMin > 0 ? formatMinutes(breakMin) : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {workMin !== null ? formatMinutes(workMin) : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {overtimeMin !== null && overtimeMin > 0 ? (
                      <span className="text-orange-600">{formatMinutes(overtimeMin)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => setEditTarget(r)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      修正
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditRecordModal
          record={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdate={(updated) => {
            onUpdate(updated);
            setEditTarget(null);
          }}
        />
      )}
    </>
  );
}
