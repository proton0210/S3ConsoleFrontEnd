import type { Metadata } from "next";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import AccountNavigation from "@/components/account-navigation";
export const metadata: Metadata = { title: "Buckets account", robots: { index: false, follow: false } };
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-scope flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <AccountNavigation />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
