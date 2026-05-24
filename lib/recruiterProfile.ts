export type RecruiterProfileRecord = {
  id?: string | null;
  user_id?: string | null;
  company_name?: string | null;
  recruiter_name?: string | null;
  work_email?: string | null;
  company_website?: string | null;
  phone_number?: string | null;
  address_line_1?: string | null;
  city?: string | null;
  state_region?: string | null;
  country?: string | null;
  hiring_focus?: string | null;
  verification_status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

function present(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function timestamp(value: string | null | undefined) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isCompleteRecruiterProfile(profile: RecruiterProfileRecord | null | undefined) {
  return Boolean(
    profile &&
      present(profile.company_name) &&
      present(profile.recruiter_name) &&
      present(profile.work_email) &&
      present(profile.company_website) &&
      present(profile.phone_number) &&
      present(profile.address_line_1) &&
      present(profile.city) &&
      present(profile.state_region) &&
      present(profile.country) &&
      present(profile.hiring_focus),
  );
}

export function normalizeRecruiterVerificationStatus(value: string | null | undefined) {
  const status = value?.trim().toLowerCase();
  return status === "verified" || status === "rejected" || status === "pending_review"
    ? status
    : "pending_review";
}

export function chooseCanonicalRecruiterProfile<T extends RecruiterProfileRecord>(rows: T[] | null | undefined) {
  return [...(rows ?? [])].sort((left, right) => {
    const leftVerifiedComplete =
      normalizeRecruiterVerificationStatus(left.verification_status) === "verified" &&
      isCompleteRecruiterProfile(left);
    const rightVerifiedComplete =
      normalizeRecruiterVerificationStatus(right.verification_status) === "verified" &&
      isCompleteRecruiterProfile(right);

    if (leftVerifiedComplete !== rightVerifiedComplete) {
      return rightVerifiedComplete ? 1 : -1;
    }

    const updatedDifference = timestamp(right.updated_at) - timestamp(left.updated_at);
    if (updatedDifference !== 0) {
      return updatedDifference;
    }

    return timestamp(right.created_at) - timestamp(left.created_at);
  })[0] ?? null;
}

