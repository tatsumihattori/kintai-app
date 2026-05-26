"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";
import { calcTotalBreakMinutes, formatMinutes } from "@/lib/calculations";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[] };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  CLOCKED_IN: { label: "出勤中", color: "bg-blue-100 text-blue-800" },
  ON_BREAK: { label: "中抜け中", color: "bg-amber-100 text-amber-800" },
  CLOCKED_OUT: { label: "退勤済", color: "bg-gray-100 text-gray-600" },
};

interface Props {
  record: RecordWithBreaks | null;
}

export function CurrentStatus({ record }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayLabel = format(now, "yyyy年M月d日（E）", { locale: ja });
  const timeLabel = format(now, "HH:mm:ss");

  const status = record?.status;
  const statusInfo = status ? STATUS_LABEL[status] : null;
  const breakMin = record ? calcTotalBreakMinutes(record.breakRecords) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
      <div className="text-center">
        <p className="text-gray-500 text-sm">{todayLabel}</p>
        <p className="text-5xl font-mono font-semibold text-gray-800 mt-1">{timeLabel}</p>
      </div>

      {statusInfo && (
        <div className="flex justify-center">
          <span className={`px-4 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      )}

      {record && (
        <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-4">
          <div>
            <p className="text-gray-400">出勤</p>
            <p className="font-medium">{format(new Date(record.clockInAt), "HH:mm")}</p>
          </div>
          <div>
            <p className="text-gray-400">退勤</p>
            <p className="font-medium">
              {record.clockOutAt ? format(new Date(record.clockOutAt), "HH:mm") : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">中抜け</p>
            <p className="font-medium">{breakMin > 0 ? formatMinutes(breakMin) : "—"}</p>
          </div>
        </div>
      )}

      {!record && (
        <p className="text-center text-gray-400 text-sm">本日はまだ打刻していません</p>
      )}
    </div>
  );
}

