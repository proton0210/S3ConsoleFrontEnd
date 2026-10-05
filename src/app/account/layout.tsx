import type { Metadata } from "next";
import Header from "@/components/sections/header";
import AccountNavigation from "@/components/account-navigation";
export const metadata: Metadata = { title: "Buckets account", robots: { index: false, follow: false } };
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-scope min-h-screen bg-background text-foreground"><Header /><AccountNavigation />{children}</div>;
}
