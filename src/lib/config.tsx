import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import { TEAM_SEAT_PRICE_USD } from "@/lib/reddit";

export const BLUR_FADE_DELAY = 0.15;

const configuredProductName = process.env.NEXT_PUBLIC_PRODUCT_NAME;
const canonicalProductName = "Buckets by ServerlessCreed";
const legacyProductNames = new Set([
  "Serverless Buckets",
  "Buckets By Serverless Creed",
  "Buckets by Serverless Creed",
]);
const productName =
  !configuredProductName || legacyProductNames.has(configuredProductName.trim())
    ? canonicalProductName
    : configuredProductName.trim();
const productDescription =
  process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION ||
  "Buckets by ServerlessCreed is a cross-platform desktop client for Amazon S3 and compatible object storage on Mac, Windows, and Linux, for browsing buckets, transferring files, sharing links, and managing multiple AWS accounts. Free 14-day trial, no credit card.";

export const siteConfig = {
  name: productName,
  shortName: "Buckets",
  publisherName: "ServerlessCreed",
  description: productDescription,
  url: process.env.NEXT_PUBLIC_APP_URL || "https://buckets.serverlesscreed.com",
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
    // Feature-led
    "S3 presigned URL generator",
    "S3 bucket policy generator",
    "AWS SSO S3",
    "S3 multi-profile",
    "S3 cost estimator",
  ],
  author: `${productName} Team`,
  creator: productName,
  publisher: "ServerlessCreed",
  category: "Software",
  links: {
    email: "buckets@serverlesscreed.com",
    twitter: "https://x.com/ServerlessCreed",
    discord: "https://discord.gg/s3console",
    github: "https://github.com/s3console",
    instagram: "https://www.instagram.com/serverlesscreed/",
    linkedin: "https://www.linkedin.com/company/serverless-creed",
  },
  header: [
    {
      href: "/#tour",
      label: "Tour",
    },
    {
      href: "/#features",
      label: "Features",
    },
    {
      href: "/pricing",
      label: "Pricing",
    },
    {
      href: "/suite",
      label: "Suite",
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
      price: "$5",
      period: "per month",
      yearlyPrice: null,
      features: [
        "Desktop app for Mac, Windows & Linux",
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
      price: "$49",
      period: "per year",
      yearlyPrice: null,
      features: [
        "Desktop app for Mac, Windows & Linux",
        "Use on 2 machines",
        "All features included",
        "Auto-renews yearly",
        "Save 18% vs monthly",
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
      price: "$99",
      period: "one-time",
      yearlyPrice: null,
      features: [
        "Desktop app for Mac, Windows & Linux",
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
    {
      name: "TEAM",
      tier: "team",
      href: "/buy?tier=team&seats=3",
      price: `$${TEAM_SEAT_PRICE_USD}`,
      period: "per seat / year · 3+ seats",
      yearlyPrice: null,
      features: [
        "Same price per seat as Yearly",
        "Seats belong to your company — reassign anytime",
        "Each member uses 2 machines",
        "One invoice for the whole team",
        "Add seats as you grow, prorated",
        "Priority email support",
      ],
      description: "Company-owned seats on one invoice. Reassign them as your team changes.",
      buttonText: "Choose Team",
      isPopular: false,
    },
  ],
  faqs: [
    {
      question: "What is the Tables + Buckets Suite?",
      answer: (
        <span>
          The Suite is Buckets Lifetime and Tables Lifetime bought together for
          $149 instead of $198. One payment on either website gives you a
          perpetual license for both desktop apps — S3 in Buckets, DynamoDB in
          Tables — on 2 machines each, with every feature and every future
          update and nothing to renew. If you already own one of them, buy the
          other on its own for $99.
        </span>
      ),
    },
    {
      question: "What is Buckets by ServerlessCreed?",
      answer: (
        <span>
          Buckets by ServerlessCreed is an independent desktop app for Amazon
          S3 and compatible object storage. It brings browsing, transfers,
          sharing, access control and multi-account sign-in together in one
          fast app for macOS, Windows and Linux.
        </span>
      ),
    },
    {
      question: "How can I get started with Buckets?",
      answer: (
        <span>
          Download and open Buckets, select an existing AWS CLI profile or sign in
          through IAM Identity Center, then choose a bucket. Start by browsing
          objects or transferring a small test file. Your AWS permissions
          determine which actions are available.
        </span>
      ),
    },
    {
      question: "What S3 features does Buckets support?",
      answer: (
        <span>
          Everyday object work (upload, download, move, preview, search and
          presigned links) plus bucket administration: versioning, storage
          classes, encryption, Object Lock, CORS, ACLs, bucket and IAM
          policies, public access blocks, and CloudFront distributions.
        </span>
      ),
    },
    {
      question: "Does Upload from URL use my computer's disk and network?",
      answer: <span>Yes. Buckets downloads the source into a temporary local file, then uploads it to S3. Keep enough disk space for the file. Both transfer legs use your network. Interrupted source downloads resume when the source supports safe range requests; otherwise they restart.</span>,
    },
    {
      question: "What can Time Travel restore?",
      answer: <span>Time Travel reconstructs an earlier state from retained S3 versions and delete markers. Each scan is capped at 200,000 entries. If that limit is reached, narrow the prefix and scan again; bulk restore is blocked for incomplete scans. Permanently deleted versions cannot be recovered. Review the plan and per-object results before treating recovery as complete.</span>,
    },
    {
      question: "Does a security scan examine every byte in my bucket?",
      answer: <span>No. The scanner samples content. Defaults are up to 5,000 objects, up to 1 MiB per object, and skipping objects larger than 50 MiB. Findings can miss sensitive data or flag harmless content. Review findings before remediation; a clean scan does not certify that a bucket is secure.</span>,
    },
    {
      question: "Are inventory search and cost estimates live AWS data?",
      answer: <span>The local search index reflects the S3 Inventory report you last imported. Local index queries do not list objects in S3, but creating and importing reports can incur AWS charges. Storage estimates use bucket size and Standard-tier pricing; they are not a full bill. Cost Explorer data has its own reporting delay and requires permissions; bucket attribution also depends on cost-allocation tags.</span>,
    },
    {
      question: "Do all features work with every S3-compatible provider?",
      answer: <span>Support depends on the provider&apos;s API and configuration. Test the operations you need during the trial. AWS services such as Athena, CloudFront, and IAM Identity Center require the corresponding AWS setup and permissions.</span>,
    },
    {
      question: "Is Buckets suitable for beginners using Amazon S3?",
      answer: (
        <span>
          Yes. Everyday tasks work like a familiar file manager, and advanced
          tools such as policy templates and code generation are there when
          you need them. Your AWS permissions decide which actions are
          available.
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
          All plans (Monthly $5, Yearly $49, Lifetime $99, Team ${TEAM_SEAT_PRICE_USD}/seat/yr)
          include identical features and let each license holder use Buckets
          on up to 2 machines. The difference is how you pay: monthly
          auto-renews each month, yearly saves 18% vs monthly, lifetime is a
          one-time payment with no recurring billing, and Team gives every
          member their own license at the Yearly price per seat, with
          company-owned seats you can reassign, one invoice and seat
          management (3-seat minimum).
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
          guarantee on Lifetime. Email buckets@serverlesscreed.com with your order
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
        { href: "/suite", text: "Tables + Buckets Suite", icon: null },
        { href: "/downloads", text: "Download", icon: null },
        { href: "/#faq", text: "FAQ", icon: null },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "#", text: "About Us", icon: null },
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
