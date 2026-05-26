import type { Metadata } from "next";

export const siteUrl = "https://iseya.jormp.com";
export const siteName = "ISEYA";
export const companyName = "Jormp LLC";
export const defaultTitle = "ISEYA — Career Infrastructure for Today’s Talent";
export const defaultDescription =
  "ISEYA helps professionals, students, recruiters, and institutions build career visibility, discover verified opportunities, and manage career growth infrastructure.";
export const defaultKeywords = [
  "career platform",
  "resume infrastructure",
  "recruiter access",
  "career visibility",
  "professional positioning",
  "job discovery",
  "career workspace",
  "employability platform",
  "recruitment infrastructure",
  "career development",
];

export const socialImage = {
  url: "/brand/iseya-logo2.png",
  width: 1855,
  height: 848,
  alt: "ISEYA career infrastructure platform",
};

export function publicPageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    title: { absolute: title },
    description,
    keywords: defaultKeywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName,
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function privatePageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index: false,
      follow: false,
      noarchive: true,
    },
  };
}

export function homepageStructuredData() {
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": organizationId,
      name: siteName,
      legalName: companyName,
      url: siteUrl,
      logo: `${siteUrl}/brand/iseya-logo2.png`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "hello@jormp.com",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      name: siteName,
      url: siteUrl,
      description: defaultDescription,
      publisher: { "@id": organizationId },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: defaultDescription,
      publisher: { "@id": organizationId },
    },
  ];
}
