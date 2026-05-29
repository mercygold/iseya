type CountryInput = {
  country?: string | null;
};

type ActiveJobInput = {
  status?: string | null;
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
  return jobs.filter((job) => {
    const status = cleanText(job.status).toLowerCase();

    return status === "published" || status === "active" || status === "open";
  }).length;
}

export function getUniqueJobCountries<T extends CountryInput & ActiveJobInput>(jobs: readonly T[]) {
  return getUniqueCountries(
    jobs.filter((job) => {
      const status = cleanText(job.status).toLowerCase();

      return status === "published" || status === "active" || status === "open";
    }),
  );
}
