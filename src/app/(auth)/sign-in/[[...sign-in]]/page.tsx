import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  // fallbackRedirectUrl (not forceRedirectUrl) so Clerk honors the
  // ?redirect_url=... query param when present — e.g. pricing-page
  // checkout flow that needs to land on /buy?tier=... post-signin.
  return <SignIn fallbackRedirectUrl="/downloads" />;
}
