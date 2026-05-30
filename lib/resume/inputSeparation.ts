export type ResumeInputBuckets = {
  candidateResumeFacts: string;
  userResumeInstructions: string;
  targetJobDescription: string;
  ignoreNoise: string;
  targetRole: string;
  sourceConfidence: "high" | "medium" | "low";
  needsReview: boolean;
};

const instructionLinePattern =
  /\b(i am tailoring my resume|please extract|position me as|professional summary direction|core skills to prioritize|use this as|key points to extract|how to present this|resume writing instructions|important resume cleanup instructions|target positioning|use implementation language|reconcile inconsistent dates|if space is limited|if space allows|do not over-focus|do not\b|make the resume|make the resume sound|keep the resume|keep resume senior|prioritize|rewrite|tailor|optimize|format this|add a short project summary)\b/i;

const jobDescriptionHeadingPattern =
  /^(full job description|job description|about\s+\w+|about estream|about the company|responsibilities|qualifications|requirements|what success looks like|preferred qualifications|about the role|the role|who you are)\b/i;

const resumeFactSignalPattern =
  /\b(llc|consulting|plc|group|foods|investofly|jormp|bech360|japaul|patjeda|choice foods|university|certificate|certification|scrummaster|google project management|blockchain council|deeplearning\.?ai|award|honou?r|recognition|\d+(?:st|nd|rd|th)\s+(?:position|place)|representative|volunteer|coach|manager|lead|owner|analyst|engineer|director|20\d{2}|19\d{2})\b/i;

const strongResumeFactSignalPattern =
  /^(\d+\.\s*)?[A-Z][A-Za-z0-9&'. ]+\s+[-–—]\s+[A-Z][A-Za-z0-9/&'. ]+$|\b(llc|consulting|plc|group|foods|investofly|jormp|bech360|japaul|patjeda|choice foods|university|certificate|certification|scrummaster|google project management|blockchain council|deeplearning\.?ai|award|honou?r|recognition|\d+(?:st|nd|rd|th)\s+(?:position|place)|representative|volunteer|coach)\b/i;

const generatedForbiddenStaticPhrases = [
  "full job description",
  "target positioning",
  "resume writing instructions",
  "use implementation language",
  "reconcile inconsistent dates",
  "if space is limited",
  "do not over-focus",
  "make the resume sound",
  "what success looks like",
  "about estream",
  "about the role",
  "about the company",
  "qualifications",
  "responsibilities",
];

const noiseLinePattern =
  /^(placeholder|sample|example|n\/a|na|none|tbd|to be added|insert here|lorem ipsum|page \d+|\d+\s*\/\s*\d+|[-_*=\s]{4,})$/i;

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const line of lines.map(cleanLine).filter(Boolean)) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(line);
  }

  return output;
}

function isInstructionLine(line: string) {
  return instructionLinePattern.test(line);
}

function isJobDescriptionHeading(line: string) {
  return jobDescriptionHeadingPattern.test(line.replace(/[:.]\s*$/g, ""));
}

function looksLikeResumeFact(line: string) {
  return resumeFactSignalPattern.test(line) && !isInstructionLine(line);
}

function looksLikeStrongResumeFact(line: string) {
  return strongResumeFactSignalPattern.test(line) && !isInstructionLine(line);
}

function isNoiseLine(line: string) {
  const cleaned = cleanLine(line);
  if (!cleaned) return true;
  if (noiseLinePattern.test(cleaned)) return true;
  if (cleaned.length <= 2 && !/\d/.test(cleaned)) return true;
  return false;
}

function lineCount(value: string) {
  return value.split(/\r?\n/).map(cleanLine).filter(Boolean).length;
}

export function separateResumeInputs({
  sourceResumeText,
  uploadedSourceText = "",
  explicitJobDescription = "",
  targetRole = "",
}: {
  sourceResumeText: string;
  uploadedSourceText?: string;
  explicitJobDescription?: string;
  targetRole?: string;
}): ResumeInputBuckets {
  const candidateFacts: string[] = [];
  const instructions: string[] = [];
  const pastedJobDescription: string[] = [];
  const noise: string[] = [];
  let inJobDescriptionBlock = false;

  const combinedSource = [sourceResumeText, uploadedSourceText]
    .filter((value) => value.trim().length > 0)
    .join("\n\n");

  for (const rawLine of combinedSource.split(/\r?\n/)) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    if (isNoiseLine(line)) {
      noise.push(line);
      continue;
    }

    if (isJobDescriptionHeading(line)) {
      inJobDescriptionBlock = true;
      pastedJobDescription.push(line);
      continue;
    }

    if (isInstructionLine(line)) {
      instructions.push(line);
      continue;
    }

    if (inJobDescriptionBlock) {
      if (looksLikeStrongResumeFact(line)) {
        inJobDescriptionBlock = false;
        candidateFacts.push(line);
      } else {
        pastedJobDescription.push(line);
      }
      continue;
    }

    candidateFacts.push(line);
  }

  const candidateResumeFacts = uniqueLines(candidateFacts).join("\n");
  const userResumeInstructions = uniqueLines(instructions).join("\n");
  const targetJobDescription = uniqueLines([explicitJobDescription, ...pastedJobDescription]).join("\n");
  const ignoreNoise = uniqueLines(noise).join("\n");
  const factsCount = lineCount(candidateResumeFacts);
  const guideCount = lineCount(userResumeInstructions) + lineCount(targetJobDescription);
  const noiseCount = lineCount(ignoreNoise);
  const sourceConfidence: ResumeInputBuckets["sourceConfidence"] =
    factsCount >= 5 && factsCount >= Math.max(2, guideCount) ? "high"
    : factsCount >= 3 && factsCount >= Math.ceil(guideCount / 2) ? "medium"
    : "low";

  return {
    candidateResumeFacts,
    userResumeInstructions,
    targetJobDescription,
    ignoreNoise,
    targetRole: cleanLine(targetRole),
    sourceConfidence,
    needsReview: sourceConfidence === "low" || factsCount < 3 || guideCount + noiseCount > factsCount * 3,
  };
}

export function generatedResumeContainsContamination(
  generatedResume: string,
  buckets: Pick<ResumeInputBuckets, "userResumeInstructions" | "targetJobDescription">,
) {
  const normalized = generatedResume.toLowerCase();

  if (generatedForbiddenStaticPhrases.some((phrase) => normalized.includes(phrase))) {
    return true;
  }

  const riskySourceLines = [
    ...buckets.userResumeInstructions.split(/\r?\n/),
    ...buckets.targetJobDescription.split(/\r?\n/),
  ]
    .map(cleanLine)
    .filter((line) => line.length >= 18 && !looksLikeResumeFact(line));

  return riskySourceLines.some((line) => normalized.includes(line.toLowerCase()));
}

export function repairGeneratedResumeContamination(
  generatedResume: string,
  buckets: Pick<ResumeInputBuckets, "userResumeInstructions" | "targetJobDescription">,
) {
  const riskyLinePatterns = [
    ...generatedForbiddenStaticPhrases.map((phrase) => new RegExp(escapeRegExp(phrase), "i")),
    ...buckets.userResumeInstructions
      .split(/\r?\n/)
      .map(cleanLine)
      .filter((line) => line.length >= 18)
      .map((line) => new RegExp(escapeRegExp(line), "i")),
    ...buckets.targetJobDescription
      .split(/\r?\n/)
      .map(cleanLine)
      .filter((line) => line.length >= 18 && !looksLikeResumeFact(line))
      .map((line) => new RegExp(escapeRegExp(line), "i")),
  ];

  return generatedResume
    .split(/\r?\n/)
    .filter((line) => !riskyLinePatterns.some((pattern) => pattern.test(line)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
