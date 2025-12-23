import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md justify-center">
      <SignIn routing="hash" />
    </div>
  );
}
