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
| `api/records` | GET | Monthly records (own only for EMPLOYEE, all for ADMIN) |
| `api/records/[id]` | PATCH | Edit record (ADMIN only) |
| `api/summary` | GET | Monthly work statistics |
| `api/export` | GET | CSV export with UTF-8 BOM for Excel |
| `api/admin/today` | GET | All employees' status today |
| `api/admin/employees` | GET/POST | Employee list management |
| `api/admin/employees/[id]` | PATCH/DELETE | Individual employee |
| `api/admin/settings` | GET/POST | App settings |

### Data Model

Core models in `prisma/schema.prisma`:

- **User** — employees with `role` (ADMIN | EMPLOYEE), `employeeCode`, `isActive`
- **AttendanceRecord** — daily record with `clockInAt/clockOutAt`, geolocation, `status` (CLOCKED_IN | ON_BREAK | CLOCKED_OUT); unique on `[userId, date]`
- **BreakRecord** — break intervals linked to an AttendanceRecord
- **AppSettings** — singleton row (`id = "singleton"`) for company name and `standardWorkMinutes`

NextAuth tables (Account, Session, VerificationToken) are managed automatically.

### Key Libraries

- `src/lib/auth.ts` — NextAuth config; validates users against DB and assigns role to JWT/session
- `src/lib/prisma.ts` — Prisma singleton with `@prisma/adapter-pg` connection pooling
- `src/lib/calculations.ts` — `calcTotalBreakMinutes`, `calcWorkMinutes`, `calcOvertimeMinutes`, `formatMinutes`
- `src/lib/csv.ts` — CSV generator (UTF-8 BOM, Japanese column headers)
- `src/types/index.ts` — NextAuth session type augmentation (adds `id`, `role`, `employeeCode`)

### Timezone

All date/time operations use `Asia/Tokyo` via `date-fns-tz`. Keep this consistent when adding new time-handling code.

### Role-Based Access

- ADMIN: all `/admin/*` routes, can view/edit all employees' records
- EMPLOYEE: own data only; `api/records` filters by session user unless caller is ADMIN

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Prisma Client Location

The generated client is at `src/generated/prisma/` (non-standard location). Import from `@/generated/prisma` or use the re-exports in `src/lib/db-types.ts`.
