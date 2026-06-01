export type QualityBadgeLabel =
  | "Strong Match"
  | "Needs More Evidence"
  | "Too Generic"
  | "Missing Keywords"
  | "Good for Recruiter Review";

export type QualityEvaluation = {
  score: number;
  badge: QualityBadgeLabel;
  notes: string[];
  addressedRequirements: string[];
  evidenceUsed: string[];
  missingEvidence: string[];
};

export type QualityApplicationKit = {
  recruiterEmail: string;
  followUpEmail: string;
  referralRequest: string;
  connectionRequest: string;
  interviewIntroPitch: string;
  tellMeAboutYourself: string;
};

export type QualityLinkedInKit = {
  headline: string;
  about: string;
  featuredProjects: string;
  topSkills: string[];
  recruiterKeywords: string[];
  openToWorkPositioning: string;
  networkingMessage: string;
  recruiterOutreachMessage: string;
};

export type QualitySectionOutput = {
  output: string;
  evaluation: QualityEvaluation;
};

export type QualityGeneratedOutputs = {
  resumeSummary: QualitySectionOutput;
  resumeBullets: QualitySectionOutput;
  coverLetter: QualitySectionOutput;
  linkedInHeadline: QualitySectionOutput;
  linkedInAbout: QualitySectionOutput;
  recruiterEmail: QualitySectionOutput;
  recruiterMessage: QualitySectionOutput;
  interviewTalkingPoints: QualitySectionOutput;
  skillGaps: QualitySectionOutput;
  careerRoadmap: QualitySectionOutput;
  linkedIn: QualityLinkedInKit;
  applicationKit: QualityApplicationKit;
};

export type QualityWorkspaceContext = {
  candidateName: string;
  role: string;
  companyName: string;
  industryName: string;
  hasJobDescription: boolean;
  hasResumeEvidence: boolean;
  skills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  bullets: string[];
  projectNames: string[];
  strongestEvidence: string[];
  sourceSignals: string[];
};

export type AiQualityAnalysis = {
  jobIntelligence: {
    targetRole: string;
    seniorityLevel: string;
    industry: string;
    requiredSkills: string[];
    preferredSkills: string[];
    toolsPlatforms: string[];
    leadershipExpectations: string[];
    technicalExpectations: string[];
    keywords: string[];
    hiringPainPoints: string[];
  };
  candidateIntelligence: {
    strongestExperiences: string[];
    relevantAchievements: string[];
    transferableSkills: string[];
    toolsUsed: string[];
    industriesDomains: string[];
    leadershipSignals: string[];
    technicalSignals: string[];
    weakAreas: string[];
    proofPoints: string[];
  };
  matchStrategy: {
    emphasize: string[];
    reduce: string[];
    keywordsToInclude: string[];
    safeClaims: string[];
    gapsToAddress: string[];
    tone: string;
    doNotInvent: string[];
  };
  positioningStatement: string;
  contentPlan: Record<string, string[]>;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  return values
    .map(cleanText)
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeText(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function articleFor(value: string) {
  return /^[aeiou]/i.test(value.trim()) ? "an" : "a";
}

function sentenceFrom(value: string, fallback: string) {
  const cleaned = cleanText(value).replace(/\s+/g, " ");
  if (!cleaned) return fallback;
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function polishedKeywords(context: QualityWorkspaceContext, analysis?: AiQualityAnalysis) {
  return uniqueStrings([
    ...context.skills,
    ...(analysis?.jobIntelligence.requiredSkills ?? []),
    ...context.matchedKeywords,
    ...context.sourceSignals,
  ])
    .filter((item) => item.length > 2)
    .map((item) => {
      if (/^stakeholder$/i.test(item)) return "Stakeholder Management";
      if (/^workflow$/i.test(item)) return "Workflow Design";
      if (/^analytics$/i.test(item)) return "Product Analytics";
      if (/^api$/i.test(item)) return "API Integration";
      return item;
    })
    .filter((item, index, list) => list.findIndex((candidate) => normalizeText(candidate) === normalizeText(item)) === index);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function hasGenericQualityText(value: string) {
  const patterns = [
    ["general", "ats"].join("\\s*"),
    ["relevant", "source", "material"].join("\\s+"),
    ["without", "inventing"].join("\\s+"),
    ["recruiter", "readability"].join("\\s+"),
    ["placeholder", "intelligence"].join("\\s+"),
    ["sample", "derived"].join("[-\\s]+"),
    "results-driven",
    "passionate",
    "hardworking",
    "proven\\s+track\\s+record",
    "lorem\\s+ipsum",
    "your\\s+company",
    "company\\s+name",
    "target\\s+company",
  ];
  return new RegExp(patterns.join("|"), "i").test(value);
}

export function qualitySentences(value: string) {
  return cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24);
}

export function hasRepeatedQualitySentences(value: string) {
  const seen = new Set<string>();
  return qualitySentences(value).some((sentence) => {
    const key = normalizeText(sentence);
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
}

export function roleKeywordPresent(value: string, role: string) {
  const roleTokens = role
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9+#]/g, ""))
    .filter((token) => token.length > 2 && !["the", "and", "for", "role", "target"].includes(token));

  if (roleTokens.length === 0 || role === "the target role") return true;

  const lowerValue = value.toLowerCase();
  return roleTokens.some((token) => lowerValue.includes(token));
}

function inferSeniorityLevel(role: string, text: string) {
  const combined = `${role} ${text}`;
  if (/\b(chief|vp|vice president|director|head of|principal|staff)\b/i.test(combined)) return "Executive / senior leadership";
  if (/\b(senior|sr\.|lead|manager)\b/i.test(combined)) return "Senior / lead";
  if (/\b(associate|junior|entry|graduate|intern)\b/i.test(combined)) return "Early career";
  return "Mid-level / experienced";
}

export function roleRubric(role: string, industry: string) {
  const combined = `${role} ${industry}`.toLowerCase();
  if (/product|program manager|project manager|technical product/.test(combined)) {
    return ["roadmap ownership", "stakeholder management", "product delivery", "technical collaboration", "metrics/business impact", "customer/user insight", "prioritization", "launch execution"];
  }
  if (/data analyst|analytics|business intelligence|bi\b/.test(combined)) {
    return ["SQL/data tools", "reporting", "dashboards", "analysis", "business insights", "visualization", "data quality", "decision support"];
  }
  if (/healthcare|health|admin|administrat|clinic|patient/.test(combined)) {
    return ["operations", "compliance", "scheduling", "documentation", "patient/customer coordination", "EMR/process tools", "process improvement"];
  }
  if (/finance|financial|fp&a|accounting|investment|risk|bank/.test(combined)) {
    return ["financial analysis", "modeling", "reporting", "reconciliation", "forecasting", "risk/compliance", "Excel/tools", "business impact"];
  }
  return ["role alignment", "stakeholder communication", "execution evidence", "tools", "measurable outcomes", "domain fit"];
}

export function buildAiQualityAnalysis(context: QualityWorkspaceContext): AiQualityAnalysis {
  const rubric = roleRubric(context.role, context.industryName);
  const requiredSkills = uniqueStrings([...context.matchedKeywords, ...rubric]).slice(0, 10);
  const preferredSkills = context.missingKeywords.slice(0, 8);
  const toolsPlatforms = uniqueStrings(
    [...context.skills, ...context.sourceSignals].filter((item) =>
      /\b(sql|excel|power bi|tableau|jira|asana|figma|salesforce|hubspot|api|python|r|ga4|supabase|next\.js|openai|emr|ehr)\b/i.test(item),
    ),
  ).slice(0, 8);
  const leadershipSignals = context.bullets.filter((bullet) => /\b(led|owned|managed|directed|coordinated|aligned|mentored)\b/i.test(bullet)).slice(0, 5);
  const technicalSignals = context.bullets.filter((bullet) => /\b(api|data|sql|analytics|platform|system|automation|technical|workflow|integration|ai|llm)\b/i.test(bullet)).slice(0, 5);
  const proofPoints = uniqueStrings([...context.strongestEvidence, ...leadershipSignals, ...technicalSignals]).slice(0, 8);
  const safeClaims = proofPoints.length > 0 ? proofPoints : context.sourceSignals.slice(0, 5);

  return {
    jobIntelligence: {
      targetRole: context.role,
      seniorityLevel: inferSeniorityLevel(context.role, context.missingKeywords.join(" ")),
      industry: context.industryName,
      requiredSkills,
      preferredSkills,
      toolsPlatforms,
      leadershipExpectations: rubric.filter((item) => /ownership|management|leadership|coordination|stakeholder|decision|prioritization/i.test(item)),
      technicalExpectations: rubric.filter((item) => /sql|tools|dashboard|technical|data|platform|modeling|emr|reporting|visualization/i.test(item)),
      keywords: uniqueStrings([...context.matchedKeywords, ...context.missingKeywords, ...rubric]).slice(0, 14),
      hiringPainPoints: context.hasJobDescription
        ? [`Evidence of ${rubric.slice(0, 3).join(", ")}.`, "Clear proof that claims can be defended in interview."]
        : ["Add a target job description to generate role-specific recruiter intelligence."],
    },
    candidateIntelligence: {
      strongestExperiences: context.bullets.slice(0, 5),
      relevantAchievements: context.strongestEvidence,
      transferableSkills: context.skills.slice(0, 10),
      toolsUsed: toolsPlatforms,
      industriesDomains: uniqueStrings([context.industryName, ...context.sourceSignals.filter((signal) => /health|finance|product|data|operations|technology|saas|ai/i.test(signal))]).slice(0, 6),
      leadershipSignals,
      technicalSignals,
      weakAreas: context.missingKeywords.length > 0 ? context.missingKeywords.slice(0, 6) : ["Proof depth and metric specificity."],
      proofPoints,
    },
    matchStrategy: {
      emphasize: uniqueStrings([...rubric.slice(0, 5), ...context.skills.slice(0, 5), ...proofPoints.slice(0, 3)]).slice(0, 10),
      reduce: ["Unsupported metrics", "generic claims", "unverified tools", "job-description phrasing copied verbatim"],
      keywordsToInclude: uniqueStrings([...context.matchedKeywords, ...context.missingKeywords]).slice(0, 10),
      safeClaims,
      gapsToAddress: context.missingKeywords.slice(0, 8),
      tone: "specific, concise, recruiter-ready, and evidence-led",
      doNotInvent: ["employers", "degrees", "tools", "metrics", "job titles", "certifications", "outcomes"],
    },
    positioningStatement: `Position this candidate as ${articleFor(context.role)} ${context.role} for ${context.industryName}, emphasizing ${uniqueStrings([...rubric, ...context.skills]).slice(0, 6).join(", ")} while keeping every claim tied to resume/source evidence.`,
    contentPlan: {
      resumeSummary: ["Lead with role fit", "include strongest supported domains", "avoid raw keyword stuffing"],
      resumeBullets: ["action + scope + supported result", "preserve truth", "align with target role keywords"],
      coverLetter: ["specific opening", "role alignment", "one evidence-backed proof point", "concise close"],
      linkedIn: ["keyword-rich headline", "natural about section", "featured evidence"],
      recruiterMessage: ["short role-specific outreach", "one proof point", "clear next step"],
      interviewTalkingPoints: ["defend strongest proof", "prepare gaps", "connect projects to role priorities"],
      gapAnalysis: ["show missing keywords", "separate safe claims from gaps", "recommend evidence collection"],
      careerRoadmap: ["strengthen missing evidence", "prepare interview examples", "align documents to target role"],
    },
  };
}

export function evaluateQualityOutput({
  section,
  text,
  context,
  analysis,
}: {
  section: string;
  text: string;
  context: QualityWorkspaceContext;
  analysis: AiQualityAnalysis;
}): QualityEvaluation {
  const cleaned = cleanText(text);
  const lowerText = cleaned.toLowerCase();
  const matchedKeywords = analysis.matchStrategy.keywordsToInclude.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase()),
  );
  const evidenceUsed = analysis.matchStrategy.safeClaims.filter((claim) => {
    const tokens = claim.toLowerCase().split(/\s+/).filter((token) => token.length > 4).slice(0, 4);
    return tokens.some((token) => lowerText.includes(token));
  }).slice(0, 4);
  const generic = hasGenericQualityText(cleaned);
  const repeated = hasRepeatedQualitySentences(cleaned);
  const wrongRole = !roleKeywordPresent(cleaned, context.role);
  const hasEvidence = evidenceUsed.length > 0 || context.hasResumeEvidence;
  const score = clampScore(
    62 +
      Math.min(16, matchedKeywords.length * 3) +
      Math.min(14, evidenceUsed.length * 5) +
      (context.hasJobDescription ? 6 : -8) +
      (hasEvidence ? 8 : -18) -
      (generic ? 18 : 0) -
      (repeated ? 10 : 0) -
      (wrongRole ? 12 : 0),
  );
  const badge: QualityBadgeLabel =
    generic ? "Too Generic"
      : !context.hasJobDescription || matchedKeywords.length === 0 ? "Missing Keywords"
        : !hasEvidence || evidenceUsed.length === 0 ? "Needs More Evidence"
          : score >= 86 ? "Strong Match"
            : "Good for Recruiter Review";

  return {
    score,
    badge,
    notes: [
      generic ? `${section} contained generic or placeholder language and should use the contextual version.` : `${section} is grounded in the current workspace context.`,
      matchedKeywords.length > 0 ? `Addresses role language: ${matchedKeywords.slice(0, 4).join(", ")}.` : "Add a target job description to strengthen keyword alignment.",
      evidenceUsed.length > 0 ? `Uses resume evidence: ${evidenceUsed.slice(0, 2).join(" | ")}.` : "More source-backed proof would improve this output.",
      repeated ? "Repeated sentence patterns were detected and should be tightened." : "No major repetition detected.",
    ],
    addressedRequirements: matchedKeywords.slice(0, 6),
    evidenceUsed,
    missingEvidence: analysis.matchStrategy.gapsToAddress.slice(0, 5),
  };
}

export function reviseOutputWithQuality({
  section,
  text,
  fallback,
  context,
  analysis,
}: {
  section: string;
  text: string;
  fallback: string;
  context: QualityWorkspaceContext;
  analysis: AiQualityAnalysis;
}) {
  const evaluation = evaluateQualityOutput({ section, text, context, analysis });
  const shouldUseFallback = evaluation.badge === "Too Generic" || evaluation.score < 58 || !roleKeywordPresent(text, context.role);
  const output = shouldUseFallback ? fallback : text.trim();

  return {
    output,
    evaluation: evaluateQualityOutput({ section, text: output, context, analysis }),
  };
}

export function buildQualityCoverLetter(context: QualityWorkspaceContext) {
  const greeting = context.companyName ? `Dear ${context.companyName} Hiring Team,` : "Dear Hiring Team,";
  const strengths = polishedKeywords(context).slice(0, 4);
  const evidence = context.strongestEvidence[0];
  const companyPhrase = context.companyName ? ` at ${context.companyName}` : "";
  const signature = context.candidateName ? `\n${context.candidateName}` : "";

  if (!context.hasResumeEvidence) {
    return `${greeting}

I am interested in the ${context.role} role. Add resume experience, projects, or source materials to make this cover letter specific to verified accomplishments.

Sincerely,${signature}`.trim();
  }

  return `${greeting}

I am interested in the ${context.role} role${companyPhrase} because it sits at the intersection of ${strengths.join(", ") || context.industryName} and practical product execution.

${evidence
  ? `A relevant proof point is ${sentenceFrom(evidence, "")} That example shows the way I work: clarify requirements, coordinate stakeholders, and move technical work toward release-ready outcomes.`
  : `My background shows alignment through ${strengths.join(", ") || "the resume evidence currently available"}, and I would welcome the opportunity to connect that experience to the role's priorities.`}

What stands out about this opportunity is the need for someone who can translate ambiguity into product decisions, collaborate with technical teams, and keep delivery tied to customer and business outcomes. I would welcome the opportunity to discuss how my background fits that need.

Sincerely,${signature}`.trim();
}

export function buildQualityApplicationOutputs(context: QualityWorkspaceContext, analysis: AiQualityAnalysis) {
  const role = context.role;
  const industry = context.industryName;
  const strengths =
    analysis.matchStrategy.emphasize.slice(0, 5).join(", ") ||
    context.skills.slice(0, 5).join(", ") ||
    context.sourceSignals.slice(0, 4).join(", ") ||
    "Add source materials or upload a resume so ISEYA can ground suggestions in verified experience.";
  const keywords = uniqueStrings([...context.matchedKeywords, ...context.skills, ...analysis.matchStrategy.keywordsToInclude]).slice(0, 12);
  const evidence = context.strongestEvidence[0];
  const companyPhrase = context.companyName ? ` at ${context.companyName}` : "";
  const article = articleFor(role);
  const primaryKeywords = uniqueStrings([
    ...context.skills,
    ...analysis.jobIntelligence.requiredSkills,
    ...context.matchedKeywords,
  ]).slice(0, 5);
  const hardSkillGaps = analysis.matchStrategy.gapsToAddress.filter((item) =>
    /\b(sql|python|api|jira|figma|analytics|dashboard|data|ehr|emr|hipaa|ai|llm|cloud|technical|platform|automation|release)\b/i.test(item),
  );
  const weakEvidenceAreas = analysis.matchStrategy.gapsToAddress.filter(
    (item) => !hardSkillGaps.includes(item),
  );
  const optionalImprovements = uniqueStrings(analysis.jobIntelligence.preferredSkills)
    .filter((item) => !hardSkillGaps.includes(item))
    .slice(0, 4);
  const immediateResumeFixes = [
    context.matchedKeywords.length > 0
      ? `Mirror supported role keywords in the summary and strongest experience bullets: ${primaryKeywords.slice(0, 4).join(", ")}.`
      : "Add a target job description so role keywords can be mapped to supported resume evidence.",
    evidence
      ? `Anchor the top resume story around this proof point: ${evidence}`
      : "Add one role-relevant proof point with ownership, scope, and outcome.",
    context.projectNames[0]
      ? `Connect ${context.projectNames[0]} directly to ${role} priorities.`
      : "Add a supported project only if the source material includes one.",
  ];
  const firstProject =
    context.projectNames[0]
      ? `${context.projectNames[0]}: ${evidence || "project evidence available in the current resume."}`
      : evidence || "Add resume experience, projects, or skills to generate contextual guidance.";
  const linkedInAbout = context.hasResumeEvidence
    ? [
        `I am ${article} ${role} focused on ${industry}, with experience across ${primaryKeywords.slice(0, 4).join(", ") || "structured product execution"}.`,
        `I specialize in translating ambiguous business and technical needs into delivery-ready requirements, stakeholder alignment, implementation plans, and release-focused execution. ${evidence ? `A representative proof point: ${sentenceFrom(evidence, "")}` : ""}`.trim(),
        `I am targeting ${role} roles where product judgment, technical collaboration, and evidence-backed delivery can improve workflows, launch readiness, and customer outcomes.`,
      ].join("\n\n")
    : "Add resume experience, projects, or skills to generate contextual guidance.";
  const recruiterMessage = context.hasResumeEvidence
    ? `Hi, I’m ${context.candidateName || articleFor(role)} ${context.candidateName ? "" : role} focused on ${role} work across ${primaryKeywords.slice(0, 3).join(", ") || industry}. ${evidence ? `My closest proof point is ${sentenceFrom(evidence, "")}` : ""} I’d value connecting if this aligns with roles you’re supporting.`
        .replace(/\s+/g, " ")
        .trim()
    : "Add resume evidence before generating recruiter outreach.";
  const conciseRecruiterMessage =
    recruiterMessage.length > 360
      ? `${recruiterMessage.slice(0, 337).replace(/\s+\S*$/, "")}. I’d value connecting if this aligns.`
      : recruiterMessage;
  const skillGapText = [
    `Missing hard skills: ${hardSkillGaps.length > 0 ? hardSkillGaps.join(", ") : "None clearly missing from the provided job description."}`,
    `Weak evidence areas: ${weakEvidenceAreas.length > 0 ? weakEvidenceAreas.join(", ") : "Proof depth and quantified scope are the main review areas."}`,
    `Optional improvements: ${optionalImprovements.length > 0 ? optionalImprovements.join(", ") : "Deepen evidence for already-supported tools instead of adding unsupported new claims."}`,
    `Immediate resume fixes: ${immediateResumeFixes.join(" ")}`,
  ];
  const careerRoadmap = [
    context.hasJobDescription
      ? `Role alignment: map ${role} requirements to the strongest supported evidence in summary, skills, and the first two experience entries.`
      : "Role alignment: add a target job description before final tailoring.",
    hardSkillGaps.length > 0
      ? `Hard-skill proof: add truthful examples for ${hardSkillGaps.slice(0, 3).join(", ")} or leave them out if unsupported.`
      : `Hard-skill proof: keep ${primaryKeywords.slice(0, 4).join(", ") || "current technical keywords"} visible in the resume and interview stories.`,
    context.projectNames[0]
      ? `Project positioning: prepare a concise deep-dive on ${context.projectNames[0]} covering problem, stakeholders, technical tradeoffs, and launch/readiness outcome.`
      : "Project positioning: add a source-backed product or implementation project if one exists.",
    `Interview readiness: prepare examples for ${analysis.jobIntelligence.leadershipExpectations.slice(0, 3).join(", ") || "stakeholder management, prioritization, and delivery judgment"}.`,
  ];

  return {
    resumeSummary: `${role} focused on ${industry}, with supported strengths in ${strengths}.`,
    resumeBullets: context.bullets.slice(0, 5),
    coverLetter: buildQualityCoverLetter(context),
    linkedIn: {
      headline: `${role} | ${industry} | ${strengths}`,
      about: linkedInAbout,
      featuredProjects: firstProject,
      topSkills: keywords.slice(0, 10),
      recruiterKeywords: keywords,
      openToWorkPositioning: `Open to ${role} opportunities in ${industry}, especially roles that value execution discipline, stakeholder leadership, and practical technical fluency.`,
      networkingMessage: context.hasJobDescription
        ? `Hi, I am exploring ${role} opportunities in ${industry} and noticed alignment with ${keywords.slice(0, 3).join(", ") || "the role requirements"}. I would value connecting.`
        : "Add a target job description to generate role-specific recruiter intelligence.",
      recruiterOutreachMessage: conciseRecruiterMessage,
    } satisfies QualityLinkedInKit,
    applicationKit: {
      recruiterEmail: `Hello,\n\nI am reaching out regarding the ${role} role${companyPhrase}. My background aligns with ${industry} needs through ${primaryKeywords.slice(0, 4).join(", ") || strengths}. ${evidence ? `One relevant proof point is ${sentenceFrom(evidence, "")}` : ""}\n\nBest regards,\n${context.candidateName}`.trim(),
      followUpEmail: `Hello,\n\nI wanted to follow up on my interest in the ${role} role${companyPhrase}. I remain interested because the opportunity aligns with my experience in ${strengths}. Please let me know if I can provide any additional information.\n\nBest regards,\n${context.candidateName}`.trim(),
      referralRequest: `Hi, I am applying for ${article} ${role} role${companyPhrase} and noticed your connection to the team. If you feel comfortable, I would appreciate a referral or any guidance on positioning my background around ${strengths}.`,
      connectionRequest: `Hi, I am exploring ${role} opportunities in ${industry} and would value connecting with people working around ${keywords.slice(0, 3).join(", ") || "this role"}.`,
      interviewIntroPitch: `I am ${article} ${role} candidate with experience in ${strengths}. ${context.projectNames[0] ? `One project I can speak to is ${context.projectNames[0]}.` : ""} I focus on turning business needs into clear priorities, aligning stakeholders, and supporting delivery that is practical and evidence-based.`,
      tellMeAboutYourself: `I have built my background around ${strengths}, with a focus on practical execution and cross-functional alignment. For this ${role} opportunity, I am especially interested in applying that experience to ${industry} challenges where clear priorities and measurable outcomes matter.`,
    } satisfies QualityApplicationKit,
    recruiterMessage: conciseRecruiterMessage,
    interviewTalkingPoints: [
      evidence ? `Defend this proof point: ${evidence}` : "Prepare one source-backed accomplishment for this role.",
      context.projectNames[0] ? `Explain ${context.projectNames[0]} in business and technical terms.` : "Add project evidence if available.",
      analysis.matchStrategy.gapsToAddress.length > 0 ? `Prepare answers for gaps around ${analysis.matchStrategy.gapsToAddress.slice(0, 3).join(", ")}.` : "Prepare deeper detail behind the strongest claims.",
    ],
    skillGaps: skillGapText,
    careerRoadmap,
  };
}

export function buildEvaluatedQualityOutputs(
  context: QualityWorkspaceContext,
  analysis = buildAiQualityAnalysis(context),
): QualityGeneratedOutputs {
  const generated = buildQualityApplicationOutputs(context, analysis);
  const evaluate = (section: string, text: string, fallback = text) =>
    reviseOutputWithQuality({
      section,
      text,
      fallback,
      context,
      analysis,
    });
  const resumeBulletsText =
    generated.resumeBullets.length > 0
      ? generated.resumeBullets.map((bullet) => `- ${bullet}`).join("\n")
      : "Add resume experience bullets to generate role-specific bullet recommendations.";
  const interviewText = generated.interviewTalkingPoints.map((item) => `- ${item}`).join("\n");
  const skillGapText =
    generated.skillGaps.length > 0
      ? generated.skillGaps.map((item) => `- ${item}`).join("\n")
      : "No major keyword gaps were detected from the current job and resume evidence.";
  const roadmapText = generated.careerRoadmap.map((item) => `- ${item}`).join("\n");

  const resumeSummary = evaluate("Resume Summary", generated.resumeSummary);
  const resumeBullets = evaluate("Resume Bullets", resumeBulletsText);
  const coverLetter = evaluate("Cover Letter", generated.coverLetter);
  const linkedInHeadline = evaluate("LinkedIn Headline", generated.linkedIn.headline);
  const linkedInAbout = evaluate("LinkedIn About", generated.linkedIn.about);
  const recruiterEmail = evaluate("Recruiter Email", generated.applicationKit.recruiterEmail);
  const recruiterMessage = evaluate("Recruiter Message", generated.recruiterMessage);
  const interviewTalkingPoints = evaluate("Interview Talking Points", interviewText);
  const skillGaps = evaluate("Skill Gap Analysis", skillGapText);
  const careerRoadmap = evaluate("Career Roadmap", roadmapText);

  return {
    resumeSummary,
    resumeBullets,
    coverLetter,
    linkedInHeadline,
    linkedInAbout,
    recruiterEmail,
    recruiterMessage,
    interviewTalkingPoints,
    skillGaps,
    careerRoadmap,
    linkedIn: {
      ...generated.linkedIn,
      headline: linkedInHeadline.output,
      about: linkedInAbout.output,
      recruiterOutreachMessage: recruiterMessage.output,
    },
    applicationKit: {
      ...generated.applicationKit,
      recruiterEmail: recruiterEmail.output,
      interviewIntroPitch: interviewTalkingPoints.output,
      tellMeAboutYourself: resumeSummary.output,
    },
  };
}
