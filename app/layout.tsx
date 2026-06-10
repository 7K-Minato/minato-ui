import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import ToastContainer from "@/components/ui/ToastContainer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minato Control Plane",
  description: "Multi-cluster game server management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReactQueryProvider>
          <ThemeProvider>
            <div className="flex h-screen">
              <MobileNav />
              <aside className="hidden w-64 md:block">
                <Sidebar />
              </aside>
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
            <ToastContainer />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
