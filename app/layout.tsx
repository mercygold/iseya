import type { Metadata } from "next";
import { defaultDescription, defaultKeywords, defaultTitle, siteName, siteUrl } from "@/lib/seo";
import PrivacyConsentBanner from "@/components/PrivacyConsentBanner";
import { AuthProvider } from "./auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: defaultKeywords,
  category: "career development",
  referrer: "origin-when-cross-origin",
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
        <PrivacyConsentBanner />
      </body>
    </html>
  );
}
