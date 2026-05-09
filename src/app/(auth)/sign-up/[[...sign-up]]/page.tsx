import { SignUp } from "@clerk/nextjs";
import { TermsAndConditions } from "@/components/terms-and-conditions";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* fallbackRedirectUrl (not forceRedirectUrl) so Clerk honors the
          ?redirect_url=... query param when present — e.g. pricing-page
          checkout flow that needs to land on /buy?tier=... post-signup. */}
      <SignUp fallbackRedirectUrl="/downloads" />
      <div className="text-center text-sm text-muted-foreground">
        By creating an account, you agree to our <TermsAndConditions /> and{" "}
        <Link
          href="/privacy"
          className="text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
