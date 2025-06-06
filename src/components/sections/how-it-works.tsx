import Features from "@/components/features-vertical";
import Section from "@/components/section";
import { LogIn, Users, FolderOpen, Play } from "lucide-react";

const data = [
  {
    id: 1,
    title: "1. Launch & Authenticate",
    content:
      "Open S3Console and securely connect using your AWS credentials. The application establishes a secure connection to your AWS account with industry-standard authentication protocols.",
    image: "/dashboard.png",
    icon: <LogIn className="w-6 h-6 text-primary" />,
  },
  {
    id: 2,
    title: "2. Auto-Discover Profiles",
    content:
      "S3Console automatically detects and loads all your existing AWS profiles and regions. Switch between different accounts and environments with a single click—no manual configuration required.",
    image: "/dashboard.png",
    icon: <Users className="w-6 h-6 text-primary" />,
  },
  {
    id: 3,
    title: "3. Browse & Manage",
    content:
      "Select any profile to instantly view all associated S3 buckets. Navigate through your storage hierarchy and perform comprehensive operations—upload, download, share, and organize with intuitive desktop controls.",
    image: "/dashboard.png",
    icon: <FolderOpen className="w-6 h-6 text-primary" />,
  },
  {
    id: 4,
    title: "4. Execute Operations",
    content:
      "Perform all S3 operations seamlessly—from generating presigned URLs to bulk file management. Every action is optimized for speed and reliability, making complex storage tasks effortless.",
    image: "/dashboard.png",
    icon: <Play className="w-6 h-6 text-primary" />,
  },
];

export default function Component() {
  return (
    <Section title="How it works" subtitle="Professional S3 management in 4 simple steps">
      <Features data={data} />
    </Section>
  );
}
