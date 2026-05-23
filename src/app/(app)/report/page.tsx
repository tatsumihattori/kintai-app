"use client";

import { useCallback, useEffect, useState } from "react";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";
import { SummaryCards } from "@/components/attendance/SummaryCards";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[] };

interface Summary {
  workingDays: number;
  totalWorkMinutes: number;
  totalOvertimeMinutes: number;
  standardWorkMinutes: number;
}

export default function ReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<RecordWithBreaks[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const [recRes, sumRes] = await Promise.all([
      fetch(`/api/records?year=${y}&month=${m}`),
      fetch(`/api/summary?year=${y}&month=${m}`),
    ]);
    const recData = await recRes.json();
    const sumData = await sumRes.json();
    setRecords(recData.records ?? []);
    setSummary(sumData);
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

  async function handleExport() {
    setExporting(true);
    const res = await fetch(`/api/export?year=${year}&month=${month}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `勤怠_${year}_${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  function updateRecord(updated: RecordWithBreaks) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">月次レポート</h1>
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
          <button
            onClick={handleExport}
            disabled={exporting || records.length === 0}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {exporting ? "出力中..." : "CSV出力"}
          </button>
        </div>
      </div>

      {summary && !loading && (
        <SummaryCards
          workingDays={summary.workingDays}
          totalWorkMinutes={summary.totalWorkMinutes}
          totalOvertimeMinutes={summary.totalOvertimeMinutes}
          standardWorkMinutes={summary.standardWorkMinutes}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">読み込み中...</p>
        ) : (
          <AttendanceTable
            records={records}
            standardWorkMinutes={summary?.standardWorkMinutes ?? 480}
            onUpdate={updateRecord}
          />
        )}
      </div>
    </div>
  );
}

