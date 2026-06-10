"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navigation = [
  { name: "Dashboard", href: "/", icon: "🏠" },
  { name: "Game Servers", href: "/gameservers", icon: "🎮" },
  { name: "Fleets", href: "/fleets", icon: "🚀" },
  { name: "Profiles", href: "/profiles", icon: "📋" },
  { name: "Control Planes", href: "/control-planes", icon: "🔌" },
  { name: "API Keys", href: "/apikeys", icon: "🔑" },
  { name: "Audit Logs", href: "/audit-logs", icon: "📜" },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg border border-white/10 bg-black/50 p-2 backdrop-blur"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 bg-black/90 border-r border-white/10">
            <div className="flex h-16 items-center border-b border-white/10 px-6">
              <Link href="/" className="text-xl font-bold">
                Minato
              </Link>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-white/70">Theme</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <span className="mr-3">🚪</span>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
