import BlurFade from "@/components/magicui/blur-fade";
import Section from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Share, UserX } from "lucide-react";

const problems = [
  {
    title: "Complex AWS Console Navigation",
    description:
      "The AWS web console is overwhelming and slow. Finding files, managing permissions, and performing bulk operations feels like navigating a maze.",
    icon: Globe,
  },
  {
    title: "Sharing Files is a Hassle",
    description:
      "Creating presigned URLs through CLI commands or complex console steps is tedious. Sharing files securely shouldn't require copy-pasting terminal commands.",
    icon: Share,
  },
  {
    title: "Multi-Account Profile Management",
    description:
      "Switching between AWS profiles, regions, and accounts requires constant re-authentication and browser tab juggling. It's a productivity killer.",
    icon: UserX,
  },
];

export default function Component() {
  return (
    <Section
      title="The S3 Management Struggle is Real"
      subtitle="S3 management shouldn’t be rocket science.








"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {problems.map((problem, index) => (
          <BlurFade key={index} delay={0.2 + index * 0.2} inView>
            <Card className="bg-background border-none shadow-none">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <problem.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
          </BlurFade>
        ))}
      </div>
    </Section>
  );
}
