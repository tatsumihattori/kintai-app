"use client";

import { useState } from "react";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[] };

interface ClockButtonsProps {
  record: RecordWithBreaks | null;
  onUpdate: (record: RecordWithBreaks) => void;
}

async function getLocation(): Promise<{ lat?: number; lng?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { timeout: 5000 }
    );
  });
}

export function ClockButtons({ record, onUpdate }: ClockButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = record?.status ?? null;

  async function handleAction(url: string, withLocation = false) {
    setLoading(true);
    setError(null);
    try {
      const body = withLocation ? await getLocation() : {};
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      onUpdate(data.record);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* 出勤 */}
        <button
          onClick={() => handleAction("/api/attendance/clock-in", true)}
          disabled={loading || status !== null}
          className="h-20 rounded-xl text-white font-bold text-lg shadow transition-all bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          出勤
        </button>

        {/* 退勤 */}
        <button
          onClick={() => handleAction("/api/attendance/clock-out", true)}
          disabled={loading || status === null || status === "CLOCKED_OUT"}
          className="h-20 rounded-xl text-white font-bold text-lg shadow transition-all bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          退勤
        </button>

        {/* 中抜け開始 */}
        <button
          onClick={() => handleAction("/api/breaks/start")}
          disabled={loading || status !== "CLOCKED_IN"}
          className="h-16 rounded-xl text-white font-bold shadow transition-all bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          中抜け開始
        </button>

        {/* 中抜け終了 */}
        <button
          onClick={() => handleAction("/api/breaks/end")}
          disabled={loading || status !== "ON_BREAK"}
          className="h-16 rounded-xl text-white font-bold shadow transition-all bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          中抜け終了
        </button>
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-400">処理中...</p>
      )}
    </div>
  );
}

