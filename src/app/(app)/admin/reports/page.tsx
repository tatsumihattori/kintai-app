"use client";

import { useCallback, useEffect, useState } from "react";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";
import { SummaryCards } from "@/components/attendance/SummaryCards";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { calcWorkMinutes, calcOvertimeMinutes } from "@/lib/calculations";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[]; standardWorkMinutes?: number | null };
interface Employee { id: string; name: string | null; email: string | null; }

export default function AdminReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [records, setRecords] = useState<RecordWithBreaks[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/employees")
      .then((r) => r.json())
      .then((data) => {
        setEmployees(data.users ?? []);
        if (data.users?.length > 0) setSelectedUserId(data.users[0].id);
      });
  }, []);

  const load = useCallback(async (y: number, m: number, userId: string) => {
    if (!userId) return;
    setLoading(true);
    const res = await fetch(`/api/records?year=${y}&month=${m}&userId=${userId}`);
    setRecords((await res.json()).records ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedUserId) load(year, month, selectedUserId);
  }, [year, month, selectedUserId, load]);

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
    const res = await fetch(`/api/export?year=${year}&month=${month}&userId=${selectedUserId}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `勤怠_${year}_${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  const workingDays = records.filter(r => r.clockOutAt).length;
  const totalWorkMinutes = records.reduce((sum, r) => {
    if (!r.clockOutAt) return sum;
    return sum + calcWorkMinutes(r.clockInAt, r.clockOutAt, r.breakRecords);
  }, 0);
  const totalOvertimeMinutes = records.reduce((sum, r) => {
    if (r.standardWorkMinutes == null || !r.clockOutAt) return sum;
    return sum + Math.max(0, calcOvertimeMinutes(
      calcWorkMinutes(r.clockInAt, r.clockOutAt, r.breakRecords),
      r.standardWorkMinutes
    ));
  }, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">全員レポート</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name ?? e.email}</option>
          ))}
        </select>
        <button onClick={prevMonth} className="px-2 py-1 rounded border hover:bg-gray-100">＜</button>
        <span className="text-sm font-medium">{year}年{month}月</span>
        <button onClick={nextMonth} disabled={year === now.getFullYear() && month === now.getMonth() + 1} className="px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-40">＞</button>
        <button onClick={handleExport} disabled={exporting} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40">
          {exporting ? "出力中..." : "CSV出力"}
        </button>
      </div>

      {!loading && records.length > 0 && (
        <SummaryCards
          workingDays={workingDays}
          totalWorkMinutes={totalWorkMinutes}
          totalOvertimeMinutes={totalOvertimeMinutes}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">読み込み中...</p>
        ) : (
          <AttendanceTable
            records={records}
            onUpdate={(updated) => setRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r))}
          />
        )}
      </div>
    </div>
  );
}
