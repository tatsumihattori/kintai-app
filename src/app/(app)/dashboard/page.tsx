"use client";

import { useEffect, useState } from "react";
import { ClockButtons } from "@/components/clock/ClockButtons";
import { CurrentStatus } from "@/components/clock/CurrentStatus";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[] };

export default function DashboardPage() {
  const [record, setRecord] = useState<RecordWithBreaks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance/status")
      .then((r) => r.json())
      .then((data) => setRecord(data.record ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <CurrentStatus record={record} />
      <ClockButtons record={record} onUpdate={setRecord} />
    </div>
  );
}

