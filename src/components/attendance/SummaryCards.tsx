import { formatMinutes } from "@/lib/calculations";

interface Props {
  workingDays: number;
  totalWorkMinutes: number;
  totalOvertimeMinutes: number;
}

export function SummaryCards({ workingDays, totalWorkMinutes, totalOvertimeMinutes }: Props) {
  const items = [
    { label: "出勤日数", value: `${workingDays}日` },
    { label: "総労働時間", value: totalWorkMinutes > 0 ? formatMinutes(totalWorkMinutes) : "0時間" },
    { label: "残業時間", value: totalOvertimeMinutes > 0 ? formatMinutes(totalOvertimeMinutes) : "0時間", highlight: totalOvertimeMinutes > 0 },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-400">{item.label}</p>
          <p className={`text-xl font-bold mt-1 ${item.highlight ? "text-orange-500" : "text-gray-800"}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
