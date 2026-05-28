import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { defaultDescription, defaultKeywords, siteName, siteUrl } from "@/lib/seo";
import { getGoogleTagManagerId } from "@/lib/analytics";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import {
  GoogleTagManagerNoScript,
  googleTagManagerBootstrap,
} from "@/components/GoogleTagManager";
import GoogleTagManagerConsent from "@/components/GoogleTagManagerConsent";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import PrivacyConsentBanner from "@/components/PrivacyConsentBanner";
import { AuthProvider } from "./auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Iseya",
  title: {
    default: "Iseya",
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
  appleWebApp: {
    capable: true,
    title: "Iseya",
    statusBarStyle: "default",
  },
  manifest: "/favicon/site.webmanifest",
  other: {
    "msapplication-TileColor": "#ffffff",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tagManagerId = getGoogleTagManagerId();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50">
        <GoogleTagManagerNoScript />
        <AuthProvider>{children}</AuthProvider>
        <PrivacyConsentBanner />
        {tagManagerId ? (
          <Script
            id="iseya-google-tag-manager"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: googleTagManagerBootstrap(tagManagerId),
            }}
          />
        ) : null}
        <GoogleTagManagerConsent />
        <GoogleAnalytics />
        <PerformanceMetrics />
      </body>
    </html>
  );
}
