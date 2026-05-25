export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { generateCsv } from "@/lib/csv";
import { deriveStandardWorkMinutes } from "@/lib/calculations";
import type { ShiftsJson } from "@/lib/db-types";

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

  const [records, user] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { userId: targetUserId, date: { gte: from, lte: to } },
      include: { breakRecords: { orderBy: { breakStartAt: "asc" } } },
      orderBy: { date: "asc" },
    }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { shiftsJson: true } }),
  ]);

  const shiftMap = (user?.shiftsJson ?? {}) as ShiftsJson;
  const enriched = records.map(r => ({
    ...r,
    standardWorkMinutes: deriveStandardWorkMinutes(
      shiftMap[String(toZonedTime(r.date, "Asia/Tokyo").getDay())]
    ),
  }));
  const csv = generateCsv(enriched);
  const filename = `勤怠_${year}_${String(month).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8-sig",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}

