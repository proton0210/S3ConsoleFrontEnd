import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminApplications } from "./admin-applications";

export const metadata = { title: "Internship Applications | S3Console Admin" };
const isAdmin = (metadata: Record<string, unknown>) => metadata.role === "admin" || metadata["role:"] === "admin";
export default async function AdminPage() {
  const user = await currentUser();
  if (!user || !isAdmin(user.publicMetadata)) redirect("/");
  return <AdminApplications project="S3Console" />;
}
