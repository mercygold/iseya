/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");

const groups = [
  {
    name: "App URL / redirects",
    required: ["NEXT_PUBLIC_APP_URL"],
    optional: ["NEXT_PUBLIC_SITE_URL"],
  },
  {
    name: "Supabase",
    required: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },
  {
    name: "OpenAI",
    required: ["OPENAI_API_KEY"],
    optional: ["OPENAI_MODEL"],
  },
  {
    name: "Stripe core",
    required: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    ],
  },
  {
    name: "Candidate Stripe prices",
    required: [
      "STRIPE_PRICE_PLUS_USD",
      "STRIPE_PRICE_PLUS_NGN",
      "STRIPE_PRICE_PLUS_GBP",
      "STRIPE_PRICE_PLUS_CAD",
      "STRIPE_PRICE_PRO_MONTHLY_USD",
      "STRIPE_PRICE_PRO_MONTHLY_NGN",
      "STRIPE_PRICE_PRO_MONTHLY_GBP",
      "STRIPE_PRICE_PRO_MONTHLY_CAD",
      "STRIPE_PRICE_PRO_ANNUAL_USD",
      "STRIPE_PRICE_PRO_ANNUAL_NGN",
      "STRIPE_PRICE_PRO_ANNUAL_GBP",
      "STRIPE_PRICE_PRO_ANNUAL_CAD",
    ],
  },
  {
    name: "Recruiter Stripe prices",
    required: [
      "STRIPE_PRICE_RECRUITER_QUARTERLY_USD",
      "STRIPE_PRICE_RECRUITER_QUARTERLY_NGN",
      "STRIPE_PRICE_RECRUITER_QUARTERLY_GBP",
      "STRIPE_PRICE_RECRUITER_QUARTERLY_CAD",
      "STRIPE_PRICE_RECRUITER_ANNUAL_USD",
      "STRIPE_PRICE_RECRUITER_ANNUAL_NGN",
      "STRIPE_PRICE_RECRUITER_ANNUAL_GBP",
      "STRIPE_PRICE_RECRUITER_ANNUAL_CAD",
    ],
  },
  {
    name: "Email",
    optional: [
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "SMTP_FROM_EMAIL",
    ],
  },
  {
    name: "Analytics / feature flags",
    optional: [
      "NEXT_PUBLIC_GTM_ID",
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
      "NEXT_PUBLIC_ENABLE_INSTITUTION_ACCESS",
    ],
  },
];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/))
      .filter(Boolean)
      .map((match) => [
        match[1],
        String(match[2] ?? "")
          .trim()
          .replace(/^['"]|['"]$/g, ""),
      ]),
  );
}

function isPlaceholder(value) {
  return (
    value === "" ||
    /(?:REPLACE_WITH|your-|your_|_your_|example\.com|your-project)/i.test(value)
  );
}

const env = readEnvFile(envPath);
const missingRequired = [];
const placeholderRequired = [];
const missingOptional = [];
const placeholderOptional = [];

for (const group of groups) {
  for (const name of group.required ?? []) {
    if (!(name in env)) {
      missingRequired.push(name);
    } else if (isPlaceholder(env[name])) {
      placeholderRequired.push(name);
    }
  }

  for (const name of group.optional ?? []) {
    if (!(name in env)) {
      missingOptional.push(name);
    } else if (isPlaceholder(env[name])) {
      placeholderOptional.push(name);
    }
  }
}

console.log("[env-check] .env.local", fs.existsSync(envPath) ? "found" : "missing");

for (const group of groups) {
  const names = [...(group.required ?? []), ...(group.optional ?? [])];
  const missing = names.filter((name) => !(name in env));
  const placeholders = names.filter((name) => name in env && isPlaceholder(env[name]));

  console.log(`[env-check] ${group.name}`, {
    configured: names.length - missing.length - placeholders.length,
    missing,
    placeholders,
  });
}

if (missingRequired.length > 0 || placeholderRequired.length > 0) {
  console.warn("[env-check] required variables need values", {
    missing: missingRequired,
    placeholders: placeholderRequired,
  });
  process.exitCode = 1;
}

if (missingOptional.length > 0 || placeholderOptional.length > 0) {
  console.warn("[env-check] optional variables to review", {
    missing: missingOptional,
    placeholders: placeholderOptional,
  });
}
