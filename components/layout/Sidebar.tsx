"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "7k-design-system/react";

const navigation = [
  { name: "Dashboard", href: "/", icon: "▪" },
  { name: "Game Servers", href: "/gameservers", icon: "▫" },
  { name: "Fleets", href: "/fleets", icon: "◆" },
  { name: "Profiles", href: "/profiles", icon: "◇" },
  { name: "Control Planes", href: "/control-planes", icon: "■" },
  { name: "API Keys", href: "/apikeys", icon: "□" },
  { name: "Audit Logs", href: "/audit-logs", icon: "▬" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r-2 border-white bg-black">
      <div className="flex h-16 items-center border-b-2 border-white px-6">
        <Link href="/" className="text-xl font-black tracking-tightest">
          MINATO
        </Link>
      </div>

      <nav className="flex-1 space-y-0 px-0 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${isActive ? "nav-item-accent" : ""} flex items-center px-4 py-3 text-sm font-medium`}
            >
              <span className="mr-3 font-mono text-lg">{item.icon}</span>
              <span className="mono-label">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t-2 border-white p-4 space-y-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="mono-label text-white/70">THEME</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center px-4 py-3 text-sm font-medium text-white/70 hover:bg-white hover:text-black transition-colors"
        >
          <span className="mr-3 font-mono text-lg">→</span>
          <span className="mono-label">SIGN OUT</span>
        </button>
      </div>
    </div>
  );
}
