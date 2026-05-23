export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = startOfDay(toZonedTime(new Date(), "Asia/Tokyo"));

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      attendanceRecords: {
        where: { date: today },
        include: { breakRecords: { orderBy: { breakStartAt: "asc" } } },
        take: 1,
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (users as any[]).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    employeeCode: u.employeeCode,
    department: u.department,
    todayRecord: u.attendanceRecords[0] ?? null,
  }));

  return NextResponse.json({ employees: result });
}

