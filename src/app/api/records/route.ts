export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  // admin は userId クエリパラメータを指定可能
  const requestedUserId = searchParams.get("userId");
  const targetUserId =
    session.user.role === "ADMIN" && requestedUserId
      ? requestedUserId
      : session.user.id;

  const base = toZonedTime(new Date(year, month - 1, 1), "Asia/Tokyo");
  const from = startOfMonth(base);
  const to = endOfMonth(base);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      userId: targetUserId,
      date: { gte: from, lte: to },
    },
    include: { breakRecords: { orderBy: { breakStartAt: "asc" } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ records });
}

