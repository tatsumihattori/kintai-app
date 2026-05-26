"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@/lib/db-types";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
  };
}

const navItems = [
  { href: "/dashboard", label: "打刻" },
  { href: "/report", label: "レポート" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-blue-800 text-white">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">勤怠</span>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-blue-600 font-medium"
                    : "hover:bg-blue-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-blue-600 font-medium"
                    : "hover:bg-blue-700"
                }`}
              >
                管理
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-200 hidden sm:block">
            {user.name ?? user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
}

