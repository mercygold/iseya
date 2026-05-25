import type { ReactNode } from "react";
import DemoShell from "./DemoShell";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
