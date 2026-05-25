"use client";

import { useEffect, useState } from "react";
import type { ShiftsJson } from "@/lib/db-types";

const DAY_LABELS: { key: string; label: string }[] = [
  { key: "1", label: "月" },
  { key: "2", label: "火" },
  { key: "3", label: "水" },
  { key: "4", label: "木" },
  { key: "5", label: "金" },
  { key: "6", label: "土" },
  { key: "0", label: "日" },
];

function minutesToTime(min: number | null): string {
  if (min === null) return "";
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMinutes(t: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

interface Employee {
  id: string;
  name: string | null;
  email: string | null;
  employeeCode: string | null;
  department: string | null;
  role: "ADMIN" | "EMPLOYEE";
  isActive: boolean;
  shiftsJson: ShiftsJson | null;
}

type ShiftRow = { startTime: string; endTime: string; breakMinutes: string };
type ShiftFormState = Record<string, ShiftRow>;

function initShiftForm(shiftsJson: ShiftsJson | null): ShiftFormState {
  const state: ShiftFormState = {};
  for (const { key } of DAY_LABELS) {
    const s = shiftsJson?.[key];
    state[key] = {
      startTime: minutesToTime(s?.startTime ?? null),
      endTime: minutesToTime(s?.endTime ?? null),
      breakMinutes: s ? String(s.breakMinutes) : "0",
    };
  }
  return state;
}

function ShiftModal({ employee, onClose, onSaved }: { employee: Employee; onClose: () => void; onSaved: () => void }) {
  const [rows, setRows] = useState<ShiftFormState>(() => initShiftForm(employee.shiftsJson));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, field: keyof ShiftRow, value: string) {
    setRows(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const body: ShiftsJson = {};
    for (const { key } of DAY_LABELS) {
      const row = rows[key];
      body[key] = {
        startTime: timeToMinutes(row.startTime),
        endTime: timeToMinutes(row.endTime),
        breakMinutes: parseInt(row.breakMinutes) || 0,
      };
    }
    const res = await fetch(`/api/admin/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存に失敗しました");
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{employee.name ?? employee.email}のシフト設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 font-medium mb-1">
            <span>曜日</span>
            <span>出勤</span>
            <span>退勤</span>
            <span>休憩(分)</span>
          </div>
          {DAY_LABELS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-4 gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <input
                type="time"
                value={rows[key].startTime}
                onChange={e => update(key, "startTime", e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <input
                type="time"
                value={rows[key].endTime}
                onChange={e => update(key, "endTime", e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <input
                type="number"
                min="0"
                value={rows[key].breakMinutes}
                onChange={e => update(key, "breakMinutes", e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full"
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [users, setUsers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", employeeCode: "", department: "", role: "EMPLOYEE" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shiftTarget, setShiftTarget] = useState<Employee | null>(null);

  async function load() {
    const res = await fetch("/api/admin/employees");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "エラー"); setSubmitting(false); return; }
    setShowForm(false);
    setForm({ email: "", name: "", employeeCode: "", department: "", role: "EMPLOYEE" });
    load();
    setSubmitting(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">社員管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 社員追加
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-medium">新規社員登録</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {[
            { key: "email", label: "メールアドレス（必須）", type: "email" },
            { key: "name", label: "氏名（必須）", type: "text" },
            { key: "employeeCode", label: "社員番号", type: "text" },
            { key: "department", label: "部署", type: "text" },
          ].map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm text-gray-600">{f.label}</span>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-sm text-gray-600">権限</span>
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="EMPLOYEE">社員</option>
              <option value="ADMIN">管理者</option>
            </select>
          </label>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
            <button onClick={handleAdd} disabled={submitting} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? "登録中..." : "登録"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-8">読み込み中...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-left bg-gray-50">
                <th className="px-4 py-2 font-medium">氏名</th>
                <th className="px-4 py-2 font-medium">メール</th>
                <th className="px-4 py-2 font-medium">部署</th>
                <th className="px-4 py-2 font-medium">権限</th>
                <th className="px-4 py-2 font-medium">状態</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{u.name ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-2">{u.department ?? "—"}</td>
                  <td className="px-4 py-2">{u.role === "ADMIN" ? "管理者" : "社員"}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      className={`text-xs px-2 py-1 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {u.isActive ? "有効" : "無効"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setShiftTarget(u)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      シフト設定
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {shiftTarget && (
        <ShiftModal
          key={shiftTarget.id}
          employee={shiftTarget}
          onClose={() => setShiftTarget(null)}
          onSaved={() => { load(); setShiftTarget(null); }}
        />
      )}
    </div>
  );
}
