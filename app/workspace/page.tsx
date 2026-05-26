import type { Metadata } from "next";
import HomeExperience from "../HomeExperience";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/workspace",
  "Career Assets Workspace | ISEYA",
  "Build, tailor, and optimize your private career assets in the ISEYA workspace.",
);

export default function WorkspacePage() {
  return <HomeExperience />;
}
