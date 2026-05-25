export function normalizeStudentEmailDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export function emailDomain(value: string | null | undefined) {
  const parts = (value ?? "").trim().toLowerCase().split("@");
  return parts.length === 2 ? normalizeStudentEmailDomain(parts[1]) : "";
}

export function statusLabel(value: string | null | undefined) {
  return (value ?? "pending_review")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

