export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BreakRecord } from "@/lib/db-types";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { lat, lng } = body as { lat?: number; lng?: number };

  const now = new Date();
  const today = startOfDay(toZonedTime(now, "Asia/Tokyo"));

  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
    include: { breakRecords: true },
  });

  if (!record) {
    return NextResponse.json({ error: "出勤記録がありません" }, { status: 400 });
  }
  if (record.clockOutAt) {
    return NextResponse.json({ error: "すでに退勤済みです" }, { status: 400 });
  }

  // 休憩中であれば休憩を終了する
  const openBreak = record.breakRecords.find((b: BreakRecord) => !b.breakEndAt);
  if (openBreak) {
    await prisma.breakRecord.update({
      where: { id: openBreak.id },
      data: { breakEndAt: now },
    });
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOutAt: now,
      clockOutLat: lat ?? null,
      clockOutLng: lng ?? null,
      status: "CLOCKED_OUT",
    },
    include: { breakRecords: { orderBy: { breakStartAt: "asc" } } },
  });

  return NextResponse.json({ record: updated });
}
