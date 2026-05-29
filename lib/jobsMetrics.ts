type CountryInput = {
  country?: string | null;
};

type ActiveJobInput = {
  status?: string | null;
  opportunity_type?: string | null;
  source_type?: string | null;
};

const excludedCountryNames = new Set([
  "global",
  "remote",
  "worldwide",
  "unknown",
  "africa",
  "asia",
  "europe",
  "north america",
  "south america",
  "oceania",
]);

const inactiveJobStatuses = new Set(["archived", "closed", "expired", "deleted", "inactive"]);
const activeJobStatuses = new Set(["published", "active", "open"]);

function cleanText(value: string | null | undefined) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeCountry(value: string | null | undefined) {
  const cleaned = cleanText(value);
  const normalized = cleaned.toLowerCase();

  if (!normalized) return "";
  if (normalized === "usa" || normalized === "us" || normalized === "u.s." || normalized === "u.s.a.") {
    return "United States";
  }
  if (normalized === "uk" || normalized === "u.k." || normalized === "gb" || normalized === "great britain") {
    return "United Kingdom";
  }
  if (normalized === "uae" || normalized === "u.a.e." || normalized === "united arab emirates") {
    return "United Arab Emirates";
  }

  return cleaned
    .split(" ")
    .map((word) =>
      word.length <= 3 && word === word.toUpperCase()
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function isIncludedCountry(country: string) {
  return Boolean(country) && !excludedCountryNames.has(country.toLowerCase());
}

function normalizedStatus(value: string | null | undefined) {
  return cleanText(value).toLowerCase();
}

function isCuratedOpportunity(job: ActiveJobInput) {
  return (
    cleanText(job.opportunity_type).toLowerCase() === "curated_opportunity" ||
    cleanText(job.source_type).toLowerCase() === "curated_opportunity"
  );
}

export function isVisibleJobForPublicListings<T extends ActiveJobInput>(job: T) {
  const status = normalizedStatus(job.status);

  if (inactiveJobStatuses.has(status)) return false;
  if (activeJobStatuses.has(status)) return true;
  if (!status && isCuratedOpportunity(job)) return true;

  // Legacy curated opportunities were originally stored as drafts in the seed file,
  // but are already part of the public /jobs seed source. Keep recruiter drafts excluded.
  return status === "draft" && isCuratedOpportunity(job);
}

export function getUniqueCountries<T extends CountryInput>(jobs: readonly T[]) {
  return Array.from(
    new Set(
      jobs
        .map((job) => normalizeCountry(job.country))
        .filter(isIncludedCountry),
    ),
  ).sort((first, second) => first.localeCompare(second));
}

export function getActiveJobsCount<T extends ActiveJobInput>(jobs: readonly T[]) {
  return jobs.filter(isVisibleJobForPublicListings).length;
}

export function getUniqueJobCountries<T extends CountryInput & ActiveJobInput>(jobs: readonly T[]) {
  return getUniqueCountries(jobs.filter(isVisibleJobForPublicListings));
}
