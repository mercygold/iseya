"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const storageKey = "resume-agent-state-v2";
const versionStorageKey = "iseya_resume_versions";
const savedResumeStorageKey = "iseya_saved_resumes";
const currentDraftStorageKey = "iseya_current_resume_draft";
const activeResumeIdStorageKey = "iseya_active_resume_id";

type SavedWorkspace = {
  masterResume?: string;
  jobDescription?: string;
  targetRole?: string;
  template?: string;
  theme?: string;
  result?: {
    rewrittenResume?: string;
    score?: number;
  } | null;
  personalBranding?: Record<string, string>;
};

type SavedVersion = {
  id: string;
  name: string;
  source?: "autosave" | "manual";
  previewLabel?: string;
  targetRole?: string;
  template?: string;
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
  matchScore?: number;
  result?: {
    rewrittenResume?: string;
    score?: number;
  };
  workspaceState?: SavedWorkspace;
};

type SavedResumeRecord = {
  id: string;
  title: string;
  source: "manual" | "autosave";
  activeVersionId?: string;
  targetRole: string;
  template: string;
  theme: string;
  updatedAt: string;
  createdAt: string;
  matchScore: number;
  previewSnippet: string;
  workspaceState: SavedWorkspace;
  versions: SavedVersion[];
};

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateTime(value?: string) {
  if (!value) return "Not saved yet";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeVersion(version: Partial<SavedVersion>): SavedVersion | null {
  if (!version.id || !version.name) return null;
  const now = new Date().toISOString();
  return {
    id: version.id,
    name: version.name,
    source: version.source === "autosave" ? "autosave" : "manual",
    previewLabel: version.previewLabel || version.targetRole || version.name,
    targetRole: version.targetRole || version.workspaceState?.targetRole || "Target Role",
    template: version.template || version.workspaceState?.template || "executive-navy",
    theme: version.theme || version.workspaceState?.theme || "deep-navy",
    createdAt: version.createdAt || now,
    updatedAt: version.updatedAt || version.createdAt || now,
    matchScore: Number(version.matchScore ?? version.result?.score ?? version.workspaceState?.result?.score ?? 0),
    result: version.result ?? version.workspaceState?.result ?? undefined,
    workspaceState: version.workspaceState,
  };
}

function normalizeRecord(record: Partial<SavedResumeRecord>): SavedResumeRecord | null {
  if (!record.id || !record.workspaceState) return null;
  const now = new Date().toISOString();
  const result = record.workspaceState.result;
  const versions = Array.isArray(record.versions)
    ? record.versions.map(normalizeVersion).filter((item): item is SavedVersion => Boolean(item))
    : [];
  return {
    id: record.id,
    title: record.title || record.workspaceState.targetRole || "Saved Resume",
    source: record.source === "autosave" ? "autosave" : "manual",
    activeVersionId: record.activeVersionId,
    targetRole: record.targetRole || record.workspaceState.targetRole || "Target Role",
    template: record.template || record.workspaceState.template || "executive-navy",
    theme: record.theme || record.workspaceState.theme || "deep-navy",
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || now,
    matchScore: Number(record.matchScore ?? result?.score ?? 0),
    previewSnippet:
      record.previewSnippet ||
      result?.rewrittenResume?.split(/\r?\n/).filter(Boolean).slice(0, 3).join(" ") ||
      record.workspaceState.masterResume?.split(/\r?\n/).filter(Boolean).slice(0, 3).join(" ") ||
      "Saved resume workspace",
    workspaceState: record.workspaceState,
    versions,
  };
}

function resumeFromVersion(version: SavedVersion): SavedResumeRecord | null {
  if (!version.workspaceState) return null;
  return normalizeRecord({
    id: id("resume"),
    title: version.targetRole || version.name,
    source: version.source === "autosave" ? "autosave" : "manual",
    activeVersionId: version.id,
    targetRole: version.targetRole || version.workspaceState.targetRole || "Target Role",
    template: version.template || version.workspaceState.template,
    theme: version.theme || version.workspaceState.theme,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
    matchScore: version.matchScore,
    previewSnippet: version.previewLabel || version.name,
    workspaceState: version.workspaceState,
    versions: version.source === "manual" ? [version] : [],
  });
}

function loadRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  const records = safeParse<Array<Partial<SavedResumeRecord>>>(
    window.localStorage.getItem(savedResumeStorageKey),
    [],
  )
    .map(normalizeRecord)
    .filter((record): record is SavedResumeRecord => Boolean(record));
  const currentDraft = normalizeRecord(
    safeParse<Partial<SavedResumeRecord>>(window.localStorage.getItem(currentDraftStorageKey), {}),
  );
  const legacyVersions = safeParse<Array<Partial<SavedVersion>>>(
    window.localStorage.getItem(versionStorageKey),
    [],
  )
    .map(normalizeVersion)
    .filter((version): version is SavedVersion => Boolean(version));
  const legacyRecords = legacyVersions
    .filter((version) => version.source !== "autosave")
    .map(resumeFromVersion)
    .filter((record): record is SavedResumeRecord => Boolean(record));
  const newestAutosave = legacyVersions
    .filter((version) => version.source === "autosave")
    .sort((left, right) => new Date(right.updatedAt || "").getTime() - new Date(left.updatedAt || "").getTime())[0];
  const migratedDraft = newestAutosave ? resumeFromVersion(newestAutosave) : null;
  const byId = new Map<string, SavedResumeRecord>();

  for (const record of [currentDraft, migratedDraft, ...records, ...legacyRecords]) {
    if (!record) continue;
    byId.set(record.id, record);
  }

  return Array.from(byId.values()).sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function saveRecords(records: SavedResumeRecord[]) {
  window.localStorage.setItem(savedResumeStorageKey, JSON.stringify(records));
}

export default function SavedResumesPage() {
  const router = useRouter();
  const [records, setRecords] = useState<SavedResumeRecord[]>(() => loadRecords());
  const [status, setStatus] = useState("");
  const activeResumeId = useMemo(
    () => (typeof window === "undefined" ? "" : window.localStorage.getItem(activeResumeIdStorageKey) || ""),
    [],
  );

  function activate(record: SavedResumeRecord, label = "Active") {
    window.localStorage.setItem(storageKey, JSON.stringify(record.workspaceState));
    window.localStorage.setItem(currentDraftStorageKey, JSON.stringify(record));
    window.localStorage.setItem(activeResumeIdStorageKey, record.id);
    setStatus(`${label}: ${record.title}`);
    router.push("/workspace");
  }

  function duplicate(record: SavedResumeRecord) {
    const now = new Date().toISOString();
    const copy = {
      ...record,
      id: id("resume"),
      title: `${record.title} Copy`,
      source: "manual" as const,
      createdAt: now,
      updatedAt: now,
      versions: record.versions.map((version) => ({ ...version, id: id("version"), createdAt: now, updatedAt: now })),
    };
    const next = [copy, ...records];
    setRecords(next);
    saveRecords(next);
    setStatus("Resume duplicated.");
  }

  function remove(record: SavedResumeRecord) {
    if (!window.confirm("Delete this saved resume? Your current workspace draft will not be deleted.")) return;
    const next = records.filter((item) => item.id !== record.id);
    setRecords(next);
    saveRecords(next);
    setStatus("Saved resume deleted.");
  }

  function exportResume(record: SavedResumeRecord) {
    const resumeText = record.workspaceState.result?.rewrittenResume || record.workspaceState.masterResume || "";
    const blob = new Blob([resumeText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#F8FAFD] px-5 py-8 text-[var(--iseya-navy)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Workspace recovery</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">My Resumes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Open saved resumes, recover the latest local draft, duplicate stable copies, or export a text backup.
            </p>
          </div>
          <Link href="/workspace" className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--iseya-navy)] px-4 text-sm font-semibold text-white">
            Back to Workspace
          </Link>
        </div>

        {status ? (
          <p className="mt-5 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">{status}</p>
        ) : null}

        <div className="mt-6 grid gap-4">
          {records.length > 0 ? records.map((record) => (
            <article
              key={record.id}
              className={`rounded-xl border bg-white p-4 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] ${
                activeResumeId === record.id ? "border-[var(--iseya-gold)]" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{record.title}</h2>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      {record.source === "autosave" ? "Current Draft" : "Manual Save"}
                    </span>
                    {activeResumeId === record.id ? (
                      <span className="rounded-full bg-[var(--iseya-gold)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--iseya-navy)]">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {record.targetRole} | Updated {formatDateTime(record.updatedAt)} | Score {Math.round(record.matchScore)}%
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {record.template} | {record.theme} | {record.versions.length} version{record.versions.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{record.previewSnippet}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button type="button" onClick={() => activate(record, "Open/Edit")} className="rounded-md bg-[var(--iseya-navy)] px-3 py-2 text-sm font-semibold text-white">
                    Open/Edit
                  </button>
                  <button type="button" onClick={() => activate(record, "Restored")} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-[var(--iseya-navy)]">
                    Restore
                  </button>
                  <button type="button" onClick={() => duplicate(record)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-[var(--iseya-navy)]">
                    Duplicate
                  </button>
                  <button type="button" onClick={() => exportResume(record)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-[var(--iseya-navy)]">
                    Export
                  </button>
                  <button type="button" onClick={() => remove(record)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          )) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600">
              No saved resumes were found on this device yet. Return to the workspace, edit your resume, then click Save Version.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
