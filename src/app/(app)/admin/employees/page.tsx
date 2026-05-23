"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  employeeCode: string | null;
  department: string | null;
  role: "ADMIN" | "EMPLOYEE";
  isActive: boolean;
}

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", employeeCode: "", department: "", role: "EMPLOYEE" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
