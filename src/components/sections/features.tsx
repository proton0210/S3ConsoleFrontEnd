import Features from "@/components/features-horizontal";
import Section from "@/components/section";
import { Share2, RefreshCw, Eye, FolderOpen } from "lucide-react";

const data = [
  {
    id: 1,
    title: "Secure Presigned URLs",
    content: "Create and share temporary download links with expiration dates for secure file access.",
    image: "/dashboard.png",
    icon: <Share2 className="h-6 w-6 text-primary" />,
  },
  {
    id: 2,
    title: "Multi-Profile Management",
    content: "Switch between multiple AWS profiles and regions instantly with zero configuration hassle.",
    image: "/dashboard.png",
    icon: <RefreshCw className="h-6 w-6 text-primary" />,
  },
  {
    id: 3,
    title: "Smart Object Preview",
    content: "Preview images, documents, and media files directly in the app without downloading.",
    image: "/dashboard.png",
    icon: <Eye className="h-6 w-6 text-primary" />,
  },
  {
    id: 4,
    title: "Streamlined S3 Operations",
    content: "Upload, download, delete, and organize your S3 objects with an intuitive drag-and-drop interface.",
    image: "/dashboard.png",
    icon: <FolderOpen className="h-6 w-6 text-primary" />,
  },
];

export default function Component() {
  return (
    <Section title="Features" subtitle="Everything you need to manage AWS S3 like a pro">
      <Features collapseDelay={5000} linePosition="bottom" data={data} />
    </Section>
  );
}
