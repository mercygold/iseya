export function reportBoundaryError(
  boundary: "application" | "global",
  error: Error & { digest?: string },
) {
  const reference = error.digest ?? "unavailable";

  if (process.env.NODE_ENV === "production") {
    console.error(`[ISEYA] ${boundary} render failure. Reference: ${reference}.`);
    return;
  }

  console.error(`[ISEYA] ${boundary} render failure. Reference: ${reference}.`, error);
}
