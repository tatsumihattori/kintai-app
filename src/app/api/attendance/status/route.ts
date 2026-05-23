export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = startOfDay(toZonedTime(new Date(), "Asia/Tokyo"));

  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
    include: { breakRecords: { orderBy: { breakStartAt: "asc" } } },
  });

  return NextResponse.json({ record });
}

