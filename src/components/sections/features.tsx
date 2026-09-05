import Features from "@/components/features-horizontal";
import Section from "@/components/section";
import {
  Share2,
  RefreshCw,
  Eye,
  Code2,
  ShieldCheck,
  Calculator,
  Lock,
  Terminal,
  Cloud,
  FileStack,
  GitBranch,
  Database,
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
      "Paste a URL. Buckets handles downloading and uploading to S3, using temporary local disk space for resumable transfers.",
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
      "Generate editable code snippets for S3 operations in TypeScript, JavaScript, and Python with one click.",
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
      "Switch between saved AWS profiles, accounts, and regions. Expired sessions may require sign-in.",
    image: "/1-profile.png",
    icon: <RefreshCw className="h-6 w-6 text-primary" />,
  },

  {
    id: 10,
    title: "Smart File Preview",
    content:
      "Preview images (PNG, JPG, SVG, WebP) and text files (JSON, XML, MD, code) inside the app. Previewing retrieves content from S3.",
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
      "Estimate monthly Standard-tier storage charges from bucket size. Requests, retrieval, transfer, and other services can add charges.",
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

const everydayIds = new Set([1, 2, 3, 4, 5, 7, 8, 10, 11]);
const everydayFeatures = data.filter((feature) => everydayIds.has(feature.id));
const advancedFeatures = data.filter((feature) => !everydayIds.has(feature.id));

export default function Component() {
  return (
    <Section
      title="Features"
      subtitle="Start with everyday S3 tasks"
    >
      <Features collapseDelay={5000} linePosition="bottom" data={everydayFeatures} />
      <details className="mt-10 rounded-xl border border-border bg-background p-5 sm:p-6">
        <summary className="cursor-pointer text-base font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          Explore administration and developer tools
        </summary>
        <p className="mt-3 text-base text-muted-foreground">
          Open these tools when your task calls for policy changes, versioning,
          cost estimates, or code. Availability depends on your AWS permissions.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {advancedFeatures.map((feature) => (
            <div key={feature.id}>
              <div className="flex items-center gap-3">
                {feature.icon}
                <h4 className="text-base font-semibold">{feature.title}</h4>
              </div>
              <p className="mt-2 text-base text-muted-foreground">{feature.content}</p>
            </div>
          ))}
        </div>
      </details>
      <div className="mt-8 rounded-xl border border-border p-5 sm:p-6">
        <h4 className="text-lg font-semibold">Recovery and search, with clear limits</h4>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h5 className="text-base font-semibold">Time Travel</h5>
            <p className="mt-2 text-base text-muted-foreground">
              Reconstruct an earlier state from retained versions. Each scan is capped at
              200,000 version and delete-marker entries. Narrow the prefix if the scan
              reaches that limit; incomplete scans cannot be used for bulk restore.
              Permanently deleted versions cannot be recovered.
            </p>
          </div>
          <div>
            <h5 className="text-base font-semibold">Inventory search</h5>
            <p className="mt-2 text-base text-muted-foreground">
              Search a local index of an imported S3 Inventory report. Results reflect
              that report, not a live listing. Creating and importing inventory can
              incur AWS charges; local index queries do not call S3.
            </p>
          </div>
        </div>
        <a href="#faq" className="mt-4 inline-block text-sm font-medium text-primary underline">
          Read about scanning, transfers, and provider support
        </a>
      </div>
    </Section>
  );
}
