"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[]; standardWorkMinutes?: number | null };

export default function HistoryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<RecordWithBreaks[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const res = await fetch(`/api/records?year=${y}&month=${m}`);
    const data = await res.json();
    setRecords(data.records ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(year, month); }, [year, month, load]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function updateRecord(updated: RecordWithBreaks) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">勤怠履歴</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-2 py-1 rounded border hover:bg-gray-100">＜</button>
          <span className="text-sm font-medium w-20 text-center">{year}年{month}月</span>
          <button
            onClick={nextMonth}
            disabled={year === now.getFullYear() && month === now.getMonth() + 1}
            className="px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-40"
          >
            ＞
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">読み込み中...</p>
        ) : (
          <AttendanceTable
            records={records}
            onUpdate={updateRecord}
          />
        )}
      </div>
    </div>
  );
}
