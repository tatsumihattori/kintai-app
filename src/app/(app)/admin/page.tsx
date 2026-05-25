"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { AttendanceRecord, AttendanceStatus, BreakRecord } from "@/lib/db-types";

type TodayRecord = AttendanceRecord & { breakRecords: BreakRecord[] };

interface Employee {
  id: string;
  name: string | null;
  email: string | null;
  employeeCode: string | null;
  department: string | null;
  todayRecord: TodayRecord | null;
}

const STATUS_CONFIG: Record<AttendanceStatus | "NONE", { label: string; color: string }> = {
  CLOCKED_IN: { label: "出勤中", color: "bg-blue-100 text-blue-800" },
  ON_BREAK: { label: "休憩中", color: "bg-amber-100 text-amber-800" },
  CLOCKED_OUT: { label: "退勤済", color: "bg-gray-100 text-gray-500" },
  NONE: { label: "未出勤", color: "bg-red-50 text-red-400" },
};

export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/today");
    const data = await res.json();
    setEmployees(data.employees ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const today = format(new Date(), "yyyy年M月d日（E）", { locale: ja });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">本日の出勤状況</h1>
        <span className="text-sm text-gray-400">{today}</span>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">読み込み中...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {employees.map((emp) => {
            const status = emp.todayRecord?.status ?? "NONE";
            const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
            const r = emp.todayRecord;

            return (
              <div key={emp.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-800">{emp.name ?? emp.email}</p>
                    {emp.department && (
                      <p className="text-xs text-gray-400">{emp.department}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                {r && (
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>出勤 {format(new Date(r.clockInAt), "HH:mm")}</span>
                    {r.clockOutAt && <span>退勤 {format(new Date(r.clockOutAt), "HH:mm")}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <a href="/admin/employees" className="text-sm text-blue-600 hover:underline">社員管理 →</a>
        <a href="/admin/reports" className="text-sm text-blue-600 hover:underline">全員レポート →</a>
      </div>
    </div>
  );
}

