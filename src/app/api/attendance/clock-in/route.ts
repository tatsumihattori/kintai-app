export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { lat, lng } = body as { lat?: number; lng?: number };

  const now = new Date();
  const today = startOfDay(toZonedTime(now, "Asia/Tokyo"));

  const existing = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });
  if (existing) {
    return NextResponse.json({ error: "すでに出勤済みです" }, { status: 400 });
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      userId: session.user.id,
      date: today,
      clockInAt: now,
      clockInLat: lat ?? null,
      clockInLng: lng ?? null,
      status: "CLOCKED_IN",
    },
    include: { breakRecords: true },
  });

  return NextResponse.json({ record });
}
