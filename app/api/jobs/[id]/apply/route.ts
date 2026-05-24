import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";
import { sendRecruiterNewApplicationEmail } from "@/lib/notificationEmails";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const submitErrorMessage =
  "Unable to submit interest right now. Please check the form and try again.";
const uploadErrorMessage = "Unable to upload file right now. Please try again.";
const applicationFileBucket = "job-application-files";
const maxAttachmentBytes = 5 * 1024 * 1024;
const allowedAttachmentExtensions = new Set(["pdf", "doc", "docx"]);
const allowedAttachmentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function formText(formData: FormData, name: string) {
  return text(formData.get(name));
}

function optionalFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

function fileExtension(filename: string) {
  return filename.toLowerCase().split(".").pop() ?? "";
}

function attachmentValidationError(file: File | null) {
  if (!file) return "";
  if (file.size > maxAttachmentBytes) {
    return "Upload PDF, DOC, or DOCX files no larger than 5MB each.";
  }
  if (
    !allowedAttachmentExtensions.has(fileExtension(file.name)) ||
    (file.type && !allowedAttachmentTypes.has(file.type))
  ) {
    return "Upload PDF, DOC, or DOCX files no larger than 5MB each.";
  }
  return "";
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const serviceRole = createSupabaseServiceRoleClient();

  if (!serviceRole) {
    return Response.json({ error: submitErrorMessage }, { status: 503 });
  }
  const storageClient = serviceRole;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return Response.json({ error: submitErrorMessage }, { status: 400 });
  }

  const fullName = formText(formData, "fullName");
  const providedEmail = formText(formData, "email").toLowerCase();
  const phoneNumber = formText(formData, "phoneNumber");
  const location = formText(formData, "location");
  const shortNote = formText(formData, "shortNote");
  const resumeFile = optionalFile(formData.get("resumeFile"));
  const coverLetterFile = optionalFile(formData.get("coverLetterFile"));
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const { data: job, error: jobError } = await serviceRole
    .from("job_posts")
    .select("id, recruiter_id, status, job_title, company_name")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (jobError || !job) {
    return Response.json({ error: "This job is not available." }, { status: 404 });
  }

  const { data: profile } = user
    ? await serviceRole
        .from("profiles")
        .select("id, email, full_name, account_type")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const candidateEmail = (providedEmail || profile?.email || user?.email || "").toLowerCase();

  if (!fullName || !validEmail(candidateEmail) || !phoneNumber || !location || !shortNote) {
    return Response.json(
      { error: "Complete all required interest fields before submitting." },
      { status: 400 },
    );
  }

  const fileError =
    attachmentValidationError(resumeFile) || attachmentValidationError(coverLetterFile);
  if (fileError) {
    return Response.json({ error: fileError }, { status: 400 });
  }

  const jobId = job.id;
  const applicationId = crypto.randomUUID();
  const uploadedPaths: string[] = [];

  async function uploadAttachment(file: File | null, label: "resume" | "cover-letter") {
    if (!file) return null;

    const extension = fileExtension(file.name);
    const path = `${jobId}/${applicationId}/${label}.${extension}`;
    const { error } = await storageClient.storage
      .from(applicationFileBucket)
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (error) {
      console.error("[jobs] application attachment upload failed", {
        code: error.name,
        message: error.message,
        jobId,
        attachment: label,
      });
      throw new Error("attachment_upload_failed");
    }

    uploadedPaths.push(path);
    return path;
  }

  let resumeFilePath: string | null = null;
  let coverLetterFilePath: string | null = null;
  try {
    resumeFilePath = await uploadAttachment(resumeFile, "resume");
    coverLetterFilePath = await uploadAttachment(coverLetterFile, "cover-letter");
  } catch {
    if (uploadedPaths.length) {
      await storageClient.storage.from(applicationFileBucket).remove(uploadedPaths);
    }
    return Response.json({ error: uploadErrorMessage }, { status: 500 });
  }

  const applicationPayload = {
    id: applicationId,
    job_id: job.id,
    candidate_id: user?.id ?? null,
    candidate_user_id: user?.id ?? null,
    candidate_email: candidateEmail || null,
    recruiter_id: job.recruiter_id,
    full_name: fullName,
    phone_number: phoneNumber,
    location,
    short_note: shortNote,
    resume_file_url: resumeFilePath,
    cover_letter_file_url: coverLetterFilePath,
    status: "submitted",
    candidate_snapshot: {
      email: candidateEmail,
      fullName,
      phoneNumber,
      location,
      shortNote,
      source: user ? "ISEYA career materials" : "Email interest",
    },
  };

  const { error } = await serviceRole.from("job_applications").insert(applicationPayload);

  if (error) {
    if (uploadedPaths.length) {
      await storageClient.storage.from(applicationFileBucket).remove(uploadedPaths);
    }
    if (error.code === "23505") {
      return Response.json({ error: "You already expressed interest in this role." }, { status: 409 });
    }

    console.error("[jobs] application failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      jobId: id,
      candidateUserIdExists: Boolean(user?.id),
    });
    return Response.json({ error: submitErrorMessage }, { status: 500 });
  }

  const { count } = await serviceRole
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("job_id", job.id);

  await serviceRole
    .from("job_posts")
    .update({ applicants_count: count ?? 1 })
    .eq("id", job.id);

  const attachments = [
    resumeFilePath ? "resume" : "",
    coverLetterFilePath ? "cover letter" : "",
  ].filter(Boolean);

  await createNotification(serviceRole, {
    userId: user?.id ?? null,
    email: candidateEmail || null,
    type: "application_submitted",
    title: "Interest submitted",
    message: `Your interest in ${job.job_title} at ${job.company_name} has been submitted.`,
    relatedJobId: job.id,
    relatedApplicationId: applicationId,
  });
  await createNotification(serviceRole, {
    userId: job.recruiter_id,
    type: "new_application",
    title: "New candidate interest received",
    message: `${fullName} submitted interest for ${job.job_title}.`,
    relatedJobId: job.id,
    relatedApplicationId: applicationId,
  });

  if (attachments.length > 0) {
    await createNotification(serviceRole, {
      userId: job.recruiter_id,
      type: "application_materials_uploaded",
      title: "Application materials uploaded",
      message: `${fullName} included a ${attachments.join(" and ")} for ${job.job_title}.`,
      relatedJobId: job.id,
      relatedApplicationId: applicationId,
    });
  }

  await sendRecruiterNewApplicationEmail({ email: null, jobTitle: job.job_title });

  return Response.json({
    ok: true,
    application: { job_id: job.id, status: "submitted" },
  });
}
