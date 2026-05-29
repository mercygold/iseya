export type CuratedOpportunityComparisonInput = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  job_title?: string | null;
  company?: string | null;
  company_name?: string | null;
  country?: string | null;
  location?: string | null;
  employment_type?: string | null;
  apply_url?: string | null;
  application_url?: string | null;
  external_apply_url?: string | null;
};

export type CuratedOpportunityDuplicateReason =
  | "slug_or_id"
  | "apply_url"
  | "title_company"
  | "title_company_country";

export type CuratedOpportunityDuplicateIndex = {
  identityKeys: Set<string>;
  applyUrls: Set<string>;
  titleCompanyKeys: Set<string>;
  titleCompanyCountryKeys: Set<string>;
};

const trackingParameters = new Set(["fbclid", "gclid", "ref", "source"]);

function field(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeCuratedOpportunityText(value: string | null | undefined) {
  return field(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCuratedOpportunityTitle(value: string | null | undefined) {
  return normalizeCuratedOpportunityText(
    field(value).replace(/\b(remote|hybrid|onsite|on site|on-site)\b/gi, " "),
  );
}

export function normalizeCuratedOpportunityUrl(value: string | null | undefined) {
  const rawValue = field(value);
  if (!rawValue) return "";

  try {
    const url = new URL(rawValue);
    for (const parameter of [...url.searchParams.keys()]) {
      const normalizedParameter = parameter.toLowerCase();
      if (normalizedParameter.startsWith("utm_") || trackingParameters.has(normalizedParameter)) {
        url.searchParams.delete(parameter);
      }
    }

    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return rawValue.toLowerCase().replace(/\s+/g, "").replace(/\/$/, "");
  }
}

function identityKey(job: CuratedOpportunityComparisonInput) {
  const id = normalizeCuratedOpportunityText(job.id);
  if (id) return `id:${id}`;

  const slug = normalizeCuratedOpportunityText(job.slug);
  if (slug) return `slug:${slug}`;

  return "";
}

function titleCompanyKey(job: CuratedOpportunityComparisonInput) {
  const title = normalizeCuratedOpportunityTitle(job.title ?? job.job_title);
  const company = normalizeCuratedOpportunityText(job.company ?? job.company_name);
  return title && company ? `${title}::${company}` : "";
}

function titleCompanyCountryKey(job: CuratedOpportunityComparisonInput) {
  const titleCompany = titleCompanyKey(job);
  const country = normalizeCuratedOpportunityText(job.country);
  return titleCompany && country ? `${titleCompany}::${country}` : "";
}

function applyUrlKey(job: CuratedOpportunityComparisonInput) {
  return normalizeCuratedOpportunityUrl(
    job.apply_url ?? job.application_url ?? job.external_apply_url,
  );
}

export function createCuratedOpportunityDuplicateIndex(
  jobs: readonly CuratedOpportunityComparisonInput[],
): CuratedOpportunityDuplicateIndex {
  const index: CuratedOpportunityDuplicateIndex = {
    identityKeys: new Set(),
    applyUrls: new Set(),
    titleCompanyKeys: new Set(),
    titleCompanyCountryKeys: new Set(),
  };

  for (const job of jobs) {
    addCuratedOpportunityToDuplicateIndex(index, job);
  }

  return index;
}

export function addCuratedOpportunityToDuplicateIndex(
  index: CuratedOpportunityDuplicateIndex,
  job: CuratedOpportunityComparisonInput,
) {
  const identity = identityKey(job);
  const applyUrl = applyUrlKey(job);
  const titleCompany = titleCompanyKey(job);
  const titleCompanyCountry = titleCompanyCountryKey(job);

  if (identity) index.identityKeys.add(identity);
  if (applyUrl) index.applyUrls.add(applyUrl);
  if (titleCompany) index.titleCompanyKeys.add(titleCompany);
  if (titleCompanyCountry) index.titleCompanyCountryKeys.add(titleCompanyCountry);
}

export function findCuratedOpportunityDuplicate(
  index: CuratedOpportunityDuplicateIndex,
  job: CuratedOpportunityComparisonInput,
): CuratedOpportunityDuplicateReason | null {
  const identity = identityKey(job);
  if (identity && index.identityKeys.has(identity)) return "slug_or_id";

  const applyUrl = applyUrlKey(job);
  if (applyUrl && index.applyUrls.has(applyUrl)) return "apply_url";

  const titleCompany = titleCompanyKey(job);
  if (titleCompany && index.titleCompanyKeys.has(titleCompany)) return "title_company";

  const titleCompanyCountry = titleCompanyCountryKey(job);
  if (titleCompanyCountry && index.titleCompanyCountryKeys.has(titleCompanyCountry)) {
    return "title_company_country";
  }

  return null;
}

export function validateCuratedOpportunityRequiredFields(
  job: CuratedOpportunityComparisonInput,
) {
  const missing: string[] = [];

  if (!field(job.title ?? job.job_title)) missing.push("title");
  if (!field(job.company ?? job.company_name)) missing.push("company");
  if (!field(job.country)) missing.push("country");
  if (!field(job.location)) missing.push("location");
  if (!field(job.employment_type)) missing.push("employment_type");
  if (!field(job.apply_url ?? job.application_url ?? job.external_apply_url)) {
    missing.push("apply_url");
  }

  return missing;
}
