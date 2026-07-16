import { auth, currentUser } from "@clerk/nextjs/server";
import { InternshipAuthGate } from "./internship-auth-gate";

export const metadata = { title: "Internship Application | S3Console" };

export default async function InternshipPage() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return <InternshipAuthGate initialEmail={email} initialName={name} />;
}
