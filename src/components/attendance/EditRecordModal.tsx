"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { AttendanceRecord, BreakRecord } from "@/lib/db-types";

type RecordWithBreaks = AttendanceRecord & { breakRecords: BreakRecord[] };

interface Props {
  record: RecordWithBreaks;
  onClose: () => void;
  onUpdate: (record: RecordWithBreaks) => void;
}

export function EditRecordModal({ record, onClose, onUpdate }: Props) {
  const [clockIn, setClockIn] = useState(
    format(new Date(record.clockInAt), "HH:mm")
  );
  const [clockOut, setClockOut] = useState(
    record.clockOutAt ? format(new Date(record.clockOutAt), "HH:mm") : ""
  );
  const [note, setNote] = useState(record.note ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateStr = format(new Date(record.date), "yyyy-MM-dd");

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string | null> = {
        clockInAt: `${dateStr}T${clockIn}:00+09:00`,
        note: note || null,
      };
      if (clockOut) {
        body.clockOutAt = `${dateStr}T${clockOut}:00+09:00`;
      }

      const res = await fetch(`/api/records/${record.id}`, {
        method: "PUT",
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-bold text-lg">
          打刻修正 — {format(new Date(record.date), "M月d日")}
        </h2>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-600">出勤時刻</span>
            <input
              type="time"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">退勤時刻</span>
            <input
              type="time"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">備考</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：テレワーク、直行直帰など"
              className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

