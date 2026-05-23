"use client";

import { useEffect, useState } from "react";

interface Settings {
  companyName: string;
  standardWorkMinutes: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ companyName: "自社", standardWorkMinutes: 480 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => { setSettings(data.settings); setLoading(false); });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const hours = Math.floor(settings.standardWorkMinutes / 60);
  const minutes = settings.standardWorkMinutes % 60;

  return (
    <div className="space-y-4 max-w-sm">
      <h1 className="text-xl font-bold">会社設定</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : (
          <>
            <label className="block">
              <span className="text-sm text-gray-600">会社名</span>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings((s) => ({ ...s, companyName: e.target.value }))}
                className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">所定労働時間（1日）</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={hours}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      standardWorkMinutes: parseInt(e.target.value) * 60 + minutes,
                    }))
                  }
                  className="w-20 border rounded-lg px-3 py-2 text-sm"
                />
                <span className="text-sm text-gray-500">時間</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={15}
                  value={minutes}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      standardWorkMinutes: hours * 60 + parseInt(e.target.value),
                    }))
                  }
                  className="w-20 border rounded-lg px-3 py-2 text-sm"
                />
                <span className="text-sm text-gray-500">分</span>
              </div>
            </label>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saved ? "保存しました ✓" : saving ? "保存中..." : "保存"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
