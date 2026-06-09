import { Icons } from "@/components/icons";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "S3Console",
  description:
    "S3Console is the fastest AWS S3 client for Mac, Windows, and Linux. A native desktop S3 GUI with AI code generation, presigned URLs, multi-profile SSO, and a visual bucket policy editor. Free 14-day trial, no credit card.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://s3console.com",
  keywords: [
    // Primary buyer-intent — winnable
    "AWS S3 client",
    "S3 client",
    "AWS S3 desktop app",
    "S3 desktop client",
    "S3 GUI",
    "AWS S3 GUI",
    "S3 bucket manager",
    "S3 bucket browser",
    "S3 explorer",
    // Platform variants
    "AWS S3 client Mac",
    "AWS S3 client Windows",
    "AWS S3 client Linux",
    "S3 GUI for Mac",
    // Comparison / alternative
    "Cyberduck alternative",
    "S3 Browser alternative",
    "CloudBerry alternative",
    "MSP360 alternative",
    // Feature-led
    "S3 presigned URL generator",
    "S3 bucket policy generator",
    "AWS SSO S3",
    "S3 multi-profile",
    "S3 cost estimator",
  ],
  author: "S3Console Team",
  creator: "S3Console",
  publisher: "S3Console",
  category: "Software",
  links: {
    email: "vidit@serverlesscreed.com",
    twitter: "https://x.com/ServerlessCreed",
    discord: "https://discord.gg/s3console",
    github: "https://github.com/s3console",
    instagram: "https://www.instagram.com/serverlesscreed/",
    linkedin: "https://www.linkedin.com/company/serverless-creed",
  },
  header: [
    {
      trigger: "Features",
      content: {
        main: {
          icon: null,
          title: "Native S3 Desktop App",
          description:
            "Professional S3 management with an intuitive interface.",
          href: "#",
        },
        items: [
          {
            href: "#",
            title: "AI Code Generation",
            description:
              "Generate S3 operation code with AI-powered suggestions.",
          },
          {
            href: "#",
            title: "Secure Presigned URLs",
            description:
              "Create and share temporary download links with expiration dates.",
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
    {
      href: "/blog",
      label: "Blog",
    },
  ],
  pricing: [
    {
      name: "MONTHLY",
      tier: "monthly",
      href: "/buy?tier=monthly",
      price: "$9",
      period: "per month",
      yearlyPrice: null,
      features: [
        "Native Mac, Windows & Linux App",
        "Use on 2 machines",
        "All features included",
        "Auto-renews monthly",
        "Cancel anytime",
        "Priority email support",
      ],
      description: "Flexible. Cancel any time from your account.",
      buttonText: "Choose Monthly",
      isPopular: false,
    },
    {
      name: "YEARLY",
      tier: "yearly",
      href: "/buy?tier=yearly",
      price: "$79",
      period: "per year",
      yearlyPrice: null,
      features: [
        "Native Mac, Windows & Linux App",
        "Use on 2 machines",
        "All features included",
        "Auto-renews yearly",
        "Save 27% vs monthly",
        "Priority email support",
      ],
      description: "Best value for daily users.",
      buttonText: "Choose Yearly",
      isPopular: true,
    },
    {
      name: "LIFETIME",
      tier: "lifetime",
      href: "/buy?tier=lifetime",
      price: "$149",
      period: "one-time",
      yearlyPrice: null,
      features: [
        "Native Mac, Windows & Linux App",
        "Use on 2 machines",
        "All features included",
        "No recurring billing",
        "All future updates free",
        "Priority email support",
      ],
      description: "Pay once, own forever.",
      buttonText: "Choose Lifetime",
      isPopular: false,
    },
  ],
  faqs: [
    {
      question: "What is S3Console?",
      answer: (
        <span>
          S3Console is a platform that helps you build and manage your AWS S3
          storage. It provides tools and services to streamline the management
          and monitoring of S3 buckets and objects.
        </span>
      ),
    },
    {
      question: "How can I get started with S3Console?",
      answer: (
        <span>
          You can get started with S3Console by signing up for an account on our
          website, connecting your AWS credentials, and following our
          quick-start guide. We also offer tutorials and documentation to help
          you along the way.
        </span>
      ),
    },
    {
      question: "What S3 features does S3Console support?",
      answer: (
        <span>
          S3Console supports a wide range of S3 features, including but not
          limited to bucket management, object operations, versioning, and
          lifecycle policies. We continuously update our platform to support the
          latest S3 capabilities.
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
    {
      question: "Is there a free trial?",
      answer: (
        <span>
          Yes — every plan starts with a 14-day free trial with full access to
          every feature. No credit card required to start. The trial is locked
          to one machine, so reinstalling the app won&apos;t reset it.
        </span>
      ),
    },
    {
      question: "What does each plan include?",
      answer: (
        <span>
          All three plans (Monthly $9, Yearly $79, Lifetime $149) include
          identical features and let you use S3Console on up to 2 machines. The
          only difference is how you pay: monthly auto-renews each month,
          yearly saves 27% vs monthly, and lifetime is a one-time payment with
          no recurring billing.
        </span>
      ),
    },
    {
      question: "Can I cancel my subscription?",
      answer: (
        <span>
          Anytime, from the in-app license menu or your{" "}
          customer portal. Subscriptions stay active until the end of the
          current billing period — no surprise charges. Lifetime is one-time
          and has nothing to cancel.
        </span>
      ),
    },
    {
      question: "Do you offer refunds?",
      answer: (
        <span>
          14-day money-back guarantee on monthly and yearly plans. 7-day
          guarantee on Lifetime. Email support@s3console.com with your order
          details — see the{" "}
          <a href="/refund-policy" className="underline hover:text-foreground">
            full refund policy
          </a>
          .
        </span>
      ),
    },
  ],
  footer: [
    {
      title: "Product",
      links: [
        { href: "/#features", text: "Features", icon: null },
        { href: "/pricing", text: "Pricing", icon: null },
        { href: "/downloads", text: "Download", icon: null },
        { href: "/#faq", text: "FAQ", icon: null },
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
          href: "https://x.com/ServerlessCreed",
          text: "X (Twitter)",
          icon: <FaXTwitter />,
        },
        {
          href: "https://www.instagram.com/serverlesscreed/",
          text: "Instagram",
          icon: <RiInstagramFill />,
        },
        {
          href: "https://www.linkedin.com/company/serverless-creed",
          text: "LinkedIn",
          icon: <FaLinkedinIn />,
        },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
