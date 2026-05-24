type NotificationEmail = {
  email: string | null | undefined;
  jobTitle?: string | null;
  status?: string | null;
};

// TODO: Connect to existing Namecheap email sending setup after core flow stabilizes.
export async function sendCandidateApplicationStatusEmail(message: NotificationEmail) {
  void message;
  return { sent: false };
}

// TODO: Connect to existing Namecheap email sending setup after core flow stabilizes.
export async function sendRecruiterNewApplicationEmail(message: NotificationEmail) {
  void message;
  return { sent: false };
}

// TODO: Connect to existing Namecheap email sending setup after core flow stabilizes.
export async function sendJobAlertEmail(message: NotificationEmail) {
  void message;
  return { sent: false };
}

// TODO: Connect to existing Namecheap email sending setup after core flow stabilizes.
export async function sendRecruiterVerificationEmail(message: NotificationEmail) {
  void message;
  return { sent: false };
}
