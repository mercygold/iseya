import type { SupabaseClient } from "@supabase/supabase-js";
import { sendJobAlertEmail } from "./notificationEmails";

export type NotificationInput = {
  userId?: string | null;
  email?: string | null;
  type: string;
  title: string;
  message: string;
  relatedJobId?: string | null;
  relatedApplicationId?: string | null;
};

export async function createNotification(
  client: SupabaseClient,
  notification: NotificationInput,
) {
  if (!notification.userId && !notification.email) {
    return;
  }

  const { error } = await client.from("notifications").insert({
    user_id: notification.userId ?? null,
    email: notification.email ?? null,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    related_job_id: notification.relatedJobId ?? null,
    related_application_id: notification.relatedApplicationId ?? null,
  });

  if (error) {
    console.error("[notifications] creation failed", {
      code: error.code,
    });
  }
}

type PublishedJobForAlerts = {
  id: string;
  job_title: string;
  company_name: string;
  location: string | null;
  workplace_type: string | null;
  employment_type: string | null;
  skills?: string[] | null;
};

function containsPreference(value: string | null | undefined, haystack: string) {
  const preference = value?.trim().toLowerCase() ?? "";
  return !preference || haystack.includes(preference);
}

export async function createMatchingJobAlertNotifications(
  client: SupabaseClient,
  job: PublishedJobForAlerts,
) {
  const { data: alerts, error } = await client
    .from("job_alert_subscriptions")
    .select("candidate_id, email, keyword, title_preference, location_preference, job_type_preference, workplace_type_preference")
    .eq("status", "active");

  if (error) {
    console.error("[notifications] alert preference lookup failed", {
      code: error.code,
    });
    return;
  }

  const searchable = [
    job.job_title,
    job.company_name,
    job.location,
    ...(job.skills ?? []),
  ].filter(Boolean).join(" ").toLowerCase();

  for (const alert of alerts ?? []) {
    const matches =
      containsPreference(alert.keyword, searchable) &&
      containsPreference(alert.title_preference, job.job_title.toLowerCase()) &&
      containsPreference(alert.location_preference, job.location?.toLowerCase() ?? "") &&
      containsPreference(alert.job_type_preference, job.employment_type?.toLowerCase() ?? "") &&
      containsPreference(alert.workplace_type_preference, job.workplace_type?.toLowerCase() ?? "");

    if (!matches) continue;

    await createNotification(client, {
      userId: alert.candidate_id,
      email: alert.email,
      type: "job_alert_match",
      title: "New opportunity matching your preferences",
      message: `${job.job_title} at ${job.company_name} has been published on ISEYA.`,
      relatedJobId: job.id,
    });
    await sendJobAlertEmail({ email: alert.email, jobTitle: job.job_title });
  }
}
