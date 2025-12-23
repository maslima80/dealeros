import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-md justify-center">
      <SignUp routing="hash" />
    </div>
  );
}
