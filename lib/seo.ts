import type { Metadata } from "next";

export const siteUrl = "https://iseya.jormp.com";
export const siteName = "ISEYA";
export const defaultTitle = "ISEYA | Career Infrastructure for Today’s Talent";
export const defaultDescription =
  "ISEYA helps candidates build career assets, tailor resumes, discover opportunities, and connect with recruiters and institutions.";
export const defaultKeywords = [
  "career infrastructure",
  "resume tailoring",
  "job readiness",
  "recruiter platform",
  "student career tools",
  "job opportunities",
  "career assets",
];

const socialImage = {
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
    title,
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
    title,
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
