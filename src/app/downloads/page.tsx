import Section from "@/components/section";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FaWindows, FaApple } from "react-icons/fa";

export default async function DownloadsPage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  return (
    <Section title="Downloads" className="py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center border rounded-lg p-6 text-center">
          <FaWindows className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold">Download for Windows</h3>
        </div>
        <div className="flex flex-col items-center border rounded-lg p-6 text-center">
          <FaApple className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold">Download for macOS</h3>
        </div>
      </div>
      <div className="mt-12 flex justify-center">
        <Button size="lg">Buy LifeTime Access now</Button>
      </div>
    </Section>
  );
}
