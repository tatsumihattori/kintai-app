export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  clockInAt: z.string().datetime().optional(),
  clockOutAt: z.string().datetime().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await prisma.attendanceRecord.findUnique({
    where: { id: params.id },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 本人 or 管理者のみ修正可能
  if (record.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.clockInAt && { clockInAt: new Date(parsed.data.clockInAt) }),
      ...(parsed.data.clockOutAt !== undefined && {
        clockOutAt: parsed.data.clockOutAt ? new Date(parsed.data.clockOutAt) : null,
      }),
      ...(parsed.data.note !== undefined && { note: parsed.data.note }),
      isEdited: true,
      editedAt: new Date(),
      editedBy: session.user.id,
    },
    include: { breakRecords: { orderBy: { breakStartAt: "asc" } } },
  });

  return NextResponse.json({ record: updated });
}
