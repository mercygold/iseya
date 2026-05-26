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
  options?: { type?: "website" | "article"; publishedTime?: string },
): Metadata {
  const openGraph =
    options?.type === "article"
      ? {
          title,
          description,
          url: path,
          siteName,
          type: "article" as const,
          publishedTime: options.publishedTime,
          images: [socialImage],
        }
      : {
          title,
          description,
          url: path,
          siteName,
          type: "website" as const,
          images: [socialImage],
        };

  return {
    title: { absolute: title },
    description,
    keywords: defaultKeywords,
    alternates: {
      canonical: path,
    },
    openGraph,
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

export function breadcrumbStructuredData(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function articleStructuredData(article: {
  path: string;
  title: string;
  description: string;
  publishedOn: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedOn,
    dateModified: article.publishedOn,
    mainEntityOfPage: `${siteUrl}${article.path}`,
    author: {
      "@type": "Organization",
      name: companyName,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      legalName: companyName,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}${socialImage.url}`,
      },
    },
  };
}

export function faqStructuredData(faq: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
