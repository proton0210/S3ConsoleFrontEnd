import { Icons } from "@/components/icons";
import { FaTwitter } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "S3Console",
  description: "Native AWS S3 Desktop App for Mac & Windows - Manage S3 buckets with an intuitive GUI. Features presigned URLs, multi-profile support, and smart file preview.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://s3console.com",
  keywords: [
    "AWS S3 desktop app",
    "S3 bucket manager",
    "AWS S3 GUI",
    "S3 file manager",
    "AWS S3 client",
    "S3 desktop client",
    "S3 management tool",
    "AWS storage manager",
    "S3 presigned URLs",
    "S3 multi-profile",
    "S3 file preview",
    "AWS S3 Mac app",
    "AWS S3 Windows app",
    "S3 bucket explorer",
    "cloud storage manager"
  ],
  author: "S3Console Team",
  creator: "S3Console",
  publisher: "S3Console",
  category: "Software",
  links: {
    email: "support@s3console.com",
    twitter: "https://twitter.com/s3console",
    discord: "https://discord.gg/s3console",
    github: "https://github.com/s3console",
    instagram: "https://instagram.com/s3console/",
  },
  header: [
    {
      trigger: "Features",
      content: {
        main: {
          icon: null,
          title: "Native S3 Desktop App",
          description: "Professional S3 management with an intuitive interface.",
          href: "#",
        },
        items: [
          {
            href: "#",
            title: "AI Code Generation",
            description: "Generate S3 operation code with AI-powered suggestions.",
          },
          {
            href: "#",
            title: "Secure Presigned URLs",
            description: "Create and share temporary download links with expiration dates.",
          },
          {
            href: "#",
            title: "Multi-Profile Management",
            description: "Switch between AWS profiles and regions instantly.",
          },
          {
            href: "#",
            title: "Smart Object Preview",
            description: "Preview files directly without downloading.",
          },
        ],
      },
    },
  ],
  pricing: [
    {
      name: "LIFETIME ACCESS",
      href: "/downloads",
      price: "$99.99",
      period: "one-time",
      yearlyPrice: null,
      features: [
        "Lifetime Access",
        "All Software Updates",
        "AI Code Generation (NEW!)",
        "Multi-Account Support",
        "Secure Presigned URLs",
        "Smart Object Preview",
        "Intuitive Desktop Interface",
        "Priority Email Support",
      ],
      description: "Everything you need for professional S3 management",
      buttonText: "Get Lifetime Access",
      isPopular: true,
    },
  ],
  faqs: [
    {
      question: "What is S3Console?",
      answer: (
        <span>
          S3Console is a platform that helps you build and manage your AWS S3
          storage. It provides tools and services to streamline the
          management and monitoring of S3 buckets and objects.
        </span>
      ),
    },
    {
      question: "How can I get started with S3Console?",
      answer: (
        <span>
          You can get started with S3Console by signing up for an account on our
          website, connecting your AWS credentials, and following our quick-start guide.
          We also offer tutorials and documentation to help you along the way.
        </span>
      ),
    },
    {
      question: "What S3 features does S3Console support?",
      answer: (
        <span>
          S3Console supports a wide range of S3 features, including but not limited
          to bucket management, object operations, versioning, and lifecycle policies.
          We continuously update our platform to support the latest
          S3 capabilities.
        </span>
      ),
    },
    {
      question: "Is S3Console suitable for beginners in AWS S3?",
      answer: (
        <span>
          Yes, S3Console is designed to be user-friendly for both beginners and
          experienced AWS users. We offer intuitive interfaces, pre-built
          templates, and extensive learning resources to help users of all skill
          levels manage their S3 storage effectively.
        </span>
      ),
    },
  ],
  footer: [
    {
      title: "Product",
      links: [
        { href: "#", text: "Features", icon: null },
        { href: "#", text: "Pricing", icon: null },
        { href: "#", text: "Documentation", icon: null },
        { href: "#", text: "API", icon: null },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "#", text: "About Us", icon: null },
        { href: "#", text: "Careers", icon: null },
        { href: "#", text: "Press", icon: null },
        { href: "#", text: "Partners", icon: null },
      ],
    },
    {
      title: "Resources",
      links: [
        { href: "#", text: "Community", icon: null },
        { href: "#", text: "Contact", icon: null },
        { href: "#", text: "Support", icon: null },
        { href: "#", text: "Status", icon: null },
      ],
    },
    {
      title: "Social",
      links: [
        {
          href: "#",
          text: "Twitter",
          icon: <FaTwitter />,
        },
        {
          href: "#",
          text: "Instagram",
          icon: <RiInstagramFill />,
        },
        {
          href: "#",
          text: "Youtube",
          icon: <FaYoutube />,
        },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
