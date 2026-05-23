export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { calcWorkMinutes, calcTotalBreakMinutes, calcOvertimeMinutes } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const requestedUserId = searchParams.get("userId");
  const targetUserId =
    session.user.role === "ADMIN" && requestedUserId
      ? requestedUserId
      : session.user.id;

  const base = toZonedTime(new Date(year, month - 1, 1), "Asia/Tokyo");
  const from = startOfMonth(base);
  const to = endOfMonth(base);

  const records = await prisma.attendanceRecord.findMany({
    where: { userId: targetUserId, date: { gte: from, lte: to } },
    include: { breakRecords: true },
  });

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  const standardWorkMinutes = settings?.standardWorkMinutes ?? 480;

  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  let totalOvertimeMinutes = 0;
  let workingDays = 0;

  for (const r of records) {
    if (!r.clockOutAt) continue;
    workingDays++;
    const breakMin = calcTotalBreakMinutes(r.breakRecords);
    const workMin = calcWorkMinutes(r.clockInAt, r.clockOutAt, r.breakRecords);
    const overtimeMin = calcOvertimeMinutes(workMin, standardWorkMinutes);
    totalBreakMinutes += breakMin;
    totalWorkMinutes += workMin;
    totalOvertimeMinutes += overtimeMin;
  }

  return NextResponse.json({
    workingDays,
    totalWorkMinutes,
    totalBreakMinutes,
    totalOvertimeMinutes,
    standardWorkMinutes,
  });
}

