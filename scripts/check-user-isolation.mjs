import { readFileSync } from "node:fs";

const page = readFileSync("app/page.tsx", "utf8");
const schema = readFileSync("supabase/migrations/001_iseya_schema.sql", "utf8");

const forbiddenPatterns = [
  new RegExp(`\\b${["a", "nu"].join("")}\\b`, "i"),
  new RegExp(["mercy", "gold"].join(""), "i"),
  new RegExp(["jos", "hua"].join(""), "i"),
  new RegExp(["949", "510", "1667"].join(""), "i"),
  new RegExp(["mercy", "gold", "96"].join(""), "i"),
  new RegExp(["inves", "tofly"].join(""), "i"),
  new RegExp(["ja", "paul"].join(""), "i"),
];

const checks = [
  {
    label: "neutral starter resume is present",
    ok: page.includes("Jordan Taylor") && page.includes("jordan@example.com"),
  },
  {
    label: "authenticated resume fetch is scoped to current user",
    ok: page.includes('.from("resumes")') && page.includes('.eq("user_id", activeUser.id)'),
  },
  {
    label: "authenticated resume updates are scoped to current user",
    ok: page.includes('.update(payload)') && page.includes('.eq("id", cloudResumeId)'),
  },
  {
    label: "shared browser resume storage is skipped for authenticated users",
    ok: page.includes("if (authUser)") && page.includes("return;"),
  },
  {
    label: "RLS limits resumes to auth.uid ownership",
    ok:
      schema.includes("resumes_select_own") &&
      schema.includes("using (auth.uid() = user_id)") &&
      schema.includes("with check (auth.uid() = user_id)"),
  },
  {
    label: "RLS checks resume_versions through parent resume ownership",
    ok:
      schema.includes("resume_versions_select_own") &&
      schema.includes("public.resumes.user_id = auth.uid()"),
  },
  {
    label: "founder/test resume markers are absent from production defaults",
    ok: forbiddenPatterns.every((pattern) => !pattern.test(page)),
  },
];

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}
