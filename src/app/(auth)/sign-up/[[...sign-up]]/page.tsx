import { SignUp } from "@clerk/nextjs";
import { TermsAndConditions } from "@/components/terms-and-conditions";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <SignUp forceRedirectUrl="/downloads" />
      <div className="text-center text-sm text-muted-foreground">
        By creating an account, you agree to our <TermsAndConditions />
      </div>
    </div>
  );
}
