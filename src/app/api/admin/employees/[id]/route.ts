export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  employeeCode: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
  isActive: z.boolean().optional(),
});

async function guard(session: Awaited<ReturnType<typeof getServerSession<typeof authOptions>>>) {
  if (!session || session.user.role !== "ADMIN") return false;
  return true;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!await guard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const shiftsJson = await req.json();
  await prisma.user.update({ where: { id: params.id }, data: { shiftsJson } });
  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!await guard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!await guard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ソフトデリート
  await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
