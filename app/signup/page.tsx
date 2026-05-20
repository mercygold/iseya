import { Suspense } from "react";
import AuthForm from "../auth/AuthForm";

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
