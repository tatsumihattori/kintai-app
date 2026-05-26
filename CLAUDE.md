# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run seed     # Seed database with initial admin user (requires SEED_ADMIN_EMAIL in .env)
```

Schema changes: `npx prisma db push` (no migration history — the DB was bootstrapped with db push, not migrate dev).
Client regeneration: `npx prisma generate`.

No test framework is configured.

## Architecture

This is a Next.js 14 App Router attendance management application (勤怠アプリ) using Supabase PostgreSQL via Prisma, NextAuth with Google OAuth, and Tailwind CSS. PWA support is enabled via next-pwa.

### Route Groups

- `src/app/(app)/` — Protected routes: `dashboard`, `history`, `report`, `admin/*`
- `src/app/(auth)/` — Public routes: `login`
- `src/app/api/` — API endpoints

Route protection is handled globally in `src/middleware.ts` via NextAuth.

### API Surface

| Path | Methods | Purpose |
|------|---------|---------|
| `api/attendance/clock-in` | POST | Create daily attendance record |
| `api/attendance/clock-out` | POST | Close attendance, end open breaks |
| `api/attendance/status` | GET | Today's status for current user |
| `api/breaks/start` | POST | Start break period |
| `api/breaks/end` | POST | End break period |
| `api/records` | GET | Monthly records with per-record `standardWorkMinutes` embedded |
| `api/records/[id]` | PATCH | Edit record (ADMIN only) |
| `api/export` | GET | CSV export with UTF-8 BOM for Excel |
| `api/admin/today` | GET | All employees' status today |
| `api/admin/employees` | GET/POST | Employee list (GET includes `shiftsJson`) |
| `api/admin/employees/[id]` | PUT/PATCH/DELETE | PUT: update fields; PATCH: save shiftsJson; DELETE: soft-delete |

There is no summary API — work statistics (workingDays, totalWorkMinutes, totalOvertimeMinutes) are computed client-side from the records response.

### Data Model

Core models in `prisma/schema.prisma`:

- **User** — employees with `role` (ADMIN | EMPLOYEE), `employeeCode`, `isActive`, and `shiftsJson Json?` (per-weekday shift config)
- **AttendanceRecord** — daily record with `clockInAt/clockOutAt`, geolocation, `status` (CLOCKED_IN | ON_BREAK | CLOCKED_OUT); unique on `[userId, date]`
- **BreakRecord** — break intervals linked to an AttendanceRecord

NextAuth tables (Account, Session, VerificationToken) are managed automatically.

### Shift & Overtime Logic

`shiftsJson` stores a weekday-keyed object `{ "0": ShiftEntry, ..., "6": ShiftEntry }` where keys are `getDay()` values (0 = Sunday). `ShiftEntry` has `startTime: number | null`, `endTime: number | null`, `breakMinutes: number` — all in minutes-since-midnight.

`deriveStandardWorkMinutes(shift)` in `src/lib/calculations.ts`:

- `null/undefined` shift → `null` (no shift set → overtime shows "—")
- `startTime === null` → `0` (holiday/day-off)
- both set → `(endTime - startTime) - breakMinutes`

`api/records` and `api/export` both fetch `user.shiftsJson`, map each record's JST weekday via `toZonedTime(r.date, "Asia/Tokyo").getDay()`, and embed `standardWorkMinutes` per record. **`toZonedTime` is required** — `r.date` is stored as UTC midnight so `.getDay()` without timezone conversion returns the wrong weekday on a UTC server.

### Key Libraries

- `src/lib/auth.ts` — NextAuth config; validates users against DB and assigns role to JWT/session
- `src/lib/prisma.ts` — Prisma singleton with `@prisma/adapter-pg` connection pooling
- `src/lib/calculations.ts` — `calcTotalBreakMinutes`, `calcWorkMinutes`, `calcOvertimeMinutes`, `formatMinutes`, `deriveStandardWorkMinutes`
- `src/lib/csv.ts` — CSV generator (UTF-8 BOM, Japanese column headers); accepts records with per-record `standardWorkMinutes`
- `src/lib/db-types.ts` — re-exports Prisma types; also defines `ShiftEntry` and `ShiftsJson`
- `src/types/index.ts` — NextAuth session type augmentation (adds `id`, `role`, `employeeCode`)

### Timezone

All date/time operations use `Asia/Tokyo` via `date-fns-tz`. Keep this consistent when adding new time-handling code.

### Role-Based Access

- ADMIN: all `/admin/*` routes, can view/edit all employees' records and shifts
- EMPLOYEE: own data only; `api/records` filters by session user unless caller is ADMIN

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Prisma Client Location

The generated client is at `src/generated/prisma/` (non-standard location). Import from `@/generated/prisma` or use the re-exports in `src/lib/db-types.ts`.

### Database

Supabase PostgreSQL. `DATABASE_URL` uses the Transaction Pooler (port 6543) for runtime queries. Schema changes use the Session Pooler (port 5432) via `prisma db push` — set `DATABASE_URL` to port 5432 when running db push locally.
