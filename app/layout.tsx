import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duy & Vy — Món quà bất ngờ",
  description: "Một món quà tình yêu nhỏ Duy dành riêng cho Vy.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
