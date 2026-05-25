export type {
  AttendanceRecord,
  BreakRecord,
  User,
  AttendanceStatus,
  Role,
} from "@/generated/prisma";

export type ShiftEntry = {
  startTime: number | null;
  endTime: number | null;
  breakMinutes: number;
};

export type ShiftsJson = Record<string, ShiftEntry>;
