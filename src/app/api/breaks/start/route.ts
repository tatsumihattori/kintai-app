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

  if (!record || record.status !== "CLOCKED_IN") {
    return NextResponse.json({ error: "出勤中でない場合は休憩できません" }, { status: 400 });
  }

  const openBreak = record.breakRecords.find((b: BreakRecord) => !b.breakEndAt);
  if (openBreak) {
    return NextResponse.json({ error: "すでに休憩中です" }, { status: 400 });
  }

  await prisma.breakRecord.create({
    data: { attendanceRecordId: record.id, breakStartAt: now },
  });

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { status: "ON_BREAK" },
    include: { breakRecords: { orderBy: { breakStartAt: "asc" } } },
  });

  return NextResponse.json({ record: updated });
}
