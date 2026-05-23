export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BreakRecord } from "@/lib/db-types";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const today = startOfDay(toZonedTime(now, "Asia/Tokyo"));

  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
    include: { breakRecords: true },
  });

  if (!record || record.status !== "ON_BREAK") {
    return NextResponse.json({ error: "休憩中ではありません" }, { status: 400 });
  }

  const openBreak = record.breakRecords.find((b: BreakRecord) => !b.breakEndAt);
  if (!openBreak) {
    return NextResponse.json({ error: "開始済みの休憩がありません" }, { status: 400 });
  }

  await prisma.breakRecord.update({
    where: { id: openBreak.id },
    data: { breakEndAt: now },
  });

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { status: "CLOCKED_IN" },
    include: { breakRecords: { orderBy: { breakStartAt: "asc" } } },
  });

  return NextResponse.json({ record: updated });
}
