export const demoCandidate = {
  name: "Amara Johnson",
  roleGoal: "Product Analyst",
  location: "Irvine, CA",
  readinessScore: 76,
  careerAssets: [
    { label: "Resume profile", progress: 100, status: "Structured" },
    { label: "Cover letter framework", progress: 80, status: "Prepared" },
    { label: "LinkedIn positioning", progress: 65, status: "In progress" },
    { label: "Application kit", progress: 50, status: "Ready to refine" },
  ],
  applications: [
    { title: "Associate Product Manager", company: "Northshore Labs", status: "Submitted", date: "May 18, 2026" },
    { title: "AI Operations Analyst", company: "Atlas Digital", status: "Reviewing", date: "May 14, 2026" },
    { title: "Business Intelligence Intern", company: "CivicMetric", status: "Proceed", date: "May 10, 2026" },
    { title: "Marketing Coordinator", company: "Harbor Studio", status: "Rejected", date: "May 5, 2026" },
  ],
  notifications: [
    "Your application for AI Operations Analyst is now under review.",
    "Your application for Business Intelligence Intern has moved forward.",
  ],
};

export const demoRecruiter = {
  company: "Atlas Digital",
  recruiter: "Maya Chen",
  verificationStatus: "Verified Recruiter",
  jobs: [
    {
      title: "Associate Product Manager",
      applicants: 8,
      statusCounts: { Submitted: 3, Reviewing: 2, Proceed: 2, Rejected: 1 },
      previews: [
        { name: "Amara Johnson", status: "Submitted", materials: "Resume + cover letter" },
        { name: "Daniel Ortiz", status: "Reviewing", materials: "Resume" },
      ],
    },
    {
      title: "AI Operations Analyst",
      applicants: 5,
      statusCounts: { Submitted: 2, Reviewing: 2, Proceed: 1 },
      previews: [
        { name: "Sophia Lee", status: "Proceed", materials: "Resume + cover letter" },
      ],
    },
    {
      title: "Customer Success Associate",
      applicants: 4,
      statusCounts: { Submitted: 1, Reviewing: 1, Proceed: 1, Rejected: 1 },
      previews: [
        { name: "Jordan Brooks", status: "Reviewing", materials: "Resume" },
      ],
    },
  ],
};

export const demoInstitution = {
  name: "Western Pacific University",
  package: "Department Access",
  seats: 1250,
  activeStudents: 842,
  status: "Active",
  seatsUsed: 67,
  applicationsSubmitted: 1426,
  recruiterEngagements: 318,
  materialsImproved: 1087,
  readinessScore: 74,
  applicationActivity: {
    Submitted: 620,
    Reviewing: 410,
    Proceed: 210,
    Rejected: 186,
  },
};
