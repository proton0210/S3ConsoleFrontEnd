import Features from "@/components/features-horizontal";
import Section from "@/components/section";
import {
  Share2,
  RefreshCw,
  Eye,
  Code2,
  ShieldCheck,
  Calculator,
  Upload,
  Lock,
  Terminal,
  Cloud,
  FileStack,
  GitBranch,
  Database,
  Download,
  Boxes,
  Link2,
  Inbox,
  KeyRound,
  Search,
  ArrowLeftRight,
} from "lucide-react";

const data = [
  {
    id: 1,
    title: "Upload from URL",
    content:
      "Pull a file straight from any link into your bucket — no local download.",
    image: "/dashboard.png",
    icon: <Link2 className="h-6 w-6 text-primary" />,
  },
  {
    id: 2,
    title: "Drop Zones",
    content:
      "Let anyone upload to S3 through a shareable link, no AWS account needed.",
    image: "/dashboard.png",
    icon: <Inbox className="h-6 w-6 text-primary" />,
  },
  {
    id: 3,
    title: "CLI Authentication",
    content:
      "Sign in with your existing AWS CLI profiles in a single click.",
    image: "/1-profile.png",
    icon: <KeyRound className="h-6 w-6 text-primary" />,
  },
  {
    id: 4,
    title: "Multi-Bucket Search",
    content:
      "Search objects across every bucket at once from one place.",
    image: "/dashboard.png",
    icon: <Search className="h-6 w-6 text-primary" />,
  },
  {
    id: 5,
    title: "Move Between Buckets",
    content:
      "Transfer objects from one bucket to another with drag-and-drop.",
    image: "/media/bucket-transfer.jpeg",
    icon: <ArrowLeftRight className="h-6 w-6 text-primary" />,
  },
  {
    id: 6,
    title: "AI Code Generation",
    content:
      "Generate production-ready code snippets for S3 operations in TypeScript, JavaScript, and Python with one click.",
    image: "/5-codegeneration.png",
    icon: <Code2 className="h-6 w-6 text-primary" />,
  },
  {
    id: 7,
    title: "AWS SSO Integration",
    content:
      "Full OAuth device authorization flow for AWS SSO and IAM Identity Center with automatic token refresh.",
    image: "/1-profile.png",
    icon: <Lock className="h-6 w-6 text-primary" />,
  },
  {
    id: 8,
    title: "Multi-Profile Support",
    content:
      "Switch between AWS profiles, accounts, and regions instantly without re-authenticating.",
    image: "/1-profile.png",
    icon: <RefreshCw className="h-6 w-6 text-primary" />,
  },

  {
    id: 10,
    title: "Smart File Preview",
    content:
      "Preview images (PNG, JPG, SVG, WebP) and text files (JSON, XML, MD, code) directly without downloading.",
    image: "/3-preview.png",
    icon: <Eye className="h-6 w-6 text-primary" />,
  },
  {
    id: 11,
    title: "Presigned URLs",
    content:
      "Create and share time-limited download links (1 minute to 7 days) with a single click.",
    image: "/4-presign.png",
    icon: <Share2 className="h-6 w-6 text-primary" />,
  },
  {
    id: 12,
    title: "Advanced Access Control",
    content:
      "Manage ACLs, Bucket Policies, IAM Policies, Public Access Blocks, and CORS with visual editors and templates.",
    image: "/dashboard.png",
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
  },
  {
    id: 13,
    title: "AWS CLI Integration",
    content:
      "Generate and execute AWS CLI commands with credentials auto-injected. Output captured in real-time.",
    image: "/dashboard.png",
    icon: <Terminal className="h-6 w-6 text-primary" />,
  },
  {
    id: 14,
    title: "CloudFront Integration",
    content:
      "Create, update, and delete CloudFront distributions. Invalidate cache paths directly from the app.",
    image: "/dashboard.png",
    icon: <Cloud className="h-6 w-6 text-primary" />,
  },
  {
    id: 15,
    title: "Batch Operations",
    content:
      "Delete multiple objects, empty entire buckets, and perform bulk operations with progress tracking.",
    image: "/dashboard.png",
    icon: <FileStack className="h-6 w-6 text-primary" />,
  },
  {
    id: 16,
    title: "Object Versioning",
    content:
      "Enable versioning on bucket creation and manage object versions with list and restore capabilities.",
    image: "/dashboard.png",
    icon: <GitBranch className="h-6 w-6 text-primary" />,
  },
  {
    id: 17,
    title: "Storage Class Management",
    content:
      "View and modify storage classes including Standard, Intelligent-Tiering, Glacier, and Deep Archive.",
    image: "/dashboard.png",
    icon: <Database className="h-6 w-6 text-primary" />,
  },
  {
    id: 18,
    title: "Cost Estimation",
    content:
      "Real-time monthly storage cost calculation based on bucket size and Standard tier pricing.",
    image: "/dashboard.png",
    icon: <Calculator className="h-6 w-6 text-primary" />,
  },

  {
    id: 20,
    title: "Advanced Bucket Config",
    content:
      "Create buckets with versioning, encryption (SSE-S3, SSE-KMS), Object Lock, and static website hosting.",
    image: "/dashboard.png",
    icon: <Boxes className="h-6 w-6 text-primary" />,
  },
];

export default function Component() {
  return (
    <Section
      title="Features"
      subtitle="Everything you need to manage AWS S3 like a pro"
    >
      <Features collapseDelay={5000} linePosition="bottom" data={data} />
    </Section>
  );
}
