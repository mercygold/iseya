import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iseya by Jormp LLC",
  description: "Tailor, optimize, and export application-ready resumes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50">{children}</body>
    </html>
  );
}
