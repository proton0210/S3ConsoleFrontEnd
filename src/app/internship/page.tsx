import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { InternshipForm } from "./internship-form";

export const metadata = { title: "Internship Application | S3Console" };

export default async function InternshipPage() {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent("/internship")}`);
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return <InternshipForm initialEmail={email} initialName={name} />;
}
