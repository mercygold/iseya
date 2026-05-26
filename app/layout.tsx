import type { Metadata } from "next";
import { defaultDescription, defaultTitle, siteUrl } from "@/lib/seo";
import { AuthProvider } from "./auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: defaultTitle,
  description: defaultDescription,
  keywords: [
    "career infrastructure",
    "resume tailoring",
    "job readiness",
    "recruiter platform",
    "student career tools",
    "job opportunities",
    "career assets",
  ],
  icons: {
    icon: "/favicon/favicon.ico",
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
