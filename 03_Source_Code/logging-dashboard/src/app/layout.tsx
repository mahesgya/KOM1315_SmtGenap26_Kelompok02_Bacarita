import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bacarita Security Logs",
  description: "Real-time authentication & security audit dashboard for Bacarita platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
