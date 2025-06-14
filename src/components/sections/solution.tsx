"use client";

import FlickeringGrid from "@/components/magicui/flickering-grid";
import Ripple from "@/components/magicui/ripple";
import Section from "@/components/section";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  {
    title: "Intuitive Desktop Interface",
    description:
      "Say goodbye to complex web consoles. Our native desktop app provides a clean, familiar interface that makes S3 management feel like working with your local file system.",
    className: "hover:bg-blue-500/10 transition-all duration-500 ease-out",
    content: (
      <>
        <Image
          src="/dashboard.png"
          alt="Intuitive Desktop Interface"
          width={800}
          height={600}
          className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300 rounded-lg"
        />
      </>
    ),
  },
  {
    title: "One-Click Secure Sharing",
    description:
      "Generate presigned URLs instantly with custom expiration times. Share files securely without touching the terminal or navigating complex console menus.",
    className:
      "order-3 xl:order-none hover:bg-green-500/10 transition-all duration-500 ease-out",
    content: (
      <Image
        src="/4-presign.png"
        alt="One-Click Secure Sharing"
        width={800}
        height={600}
        className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300 rounded-lg"
      />
    ),
  },
  {
    title: "Seamless Profile Switching",
    description:
      "Switch between AWS profiles, regions, and accounts with a single click. No more browser tabs, no re-authentication hassles, just instant access to all your S3 resources.",
    className:
      "md:row-span-2 hover:bg-purple-500/10 transition-all duration-500 ease-out",
    content: (
      <>
        <FlickeringGrid
          className="z-0 absolute inset-0 [mask:radial-gradient(circle_at_center,#fff_400px,transparent_0)]"
          squareSize={4}
          gridGap={6}
          color="#000"
          maxOpacity={0.1}
          flickerChance={0.1}
          height={800}
          width={800}
        />
        <Image
          src="/1-profile.png"
          alt="Seamless Profile Switching"
          width={800}
          height={600}
          className="-mb-32 ml-6 mt-8 h-auto px-2 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-x-[-10px] transition-all duration-300 rounded-lg"
        />
      </>
    ),
  },
  {
    title: "Smart File Operations",
    description:
      "Drag-and-drop uploads, bulk operations, file previews, and intelligent organization tools. Everything you'd expect from a modern file manager, optimized for S3.",
    className:
      "flex-row order-4 md:col-span-2 md:flex-row xl:order-none hover:bg-orange-500/10 transition-all duration-500 ease-out",
    content: (
      <>
        <Ripple className="absolute -bottom-full" />
        <Image
          src="/2-create-bucket.png"
          alt="Smart File Operations"
          width={800}
          height={600}
          className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300 rounded-lg"
        />
      </>
    ),
  },
];

export default function Component() {
  return (
    <Section
      title="Meet Your New S3 Workflow"
      subtitle="A Desktop App That Actually Gets S3 Management Right"
      description="No more wrestling with web consoles or wrestling with CLI commands. S3Console brings the simplicity of modern desktop apps to AWS S3 management."
      className="bg-neutral-100 dark:bg-neutral-900"
    >
      <div className="mx-auto mt-16 grid max-w-sm grid-cols-1 gap-6 text-gray-500 md:max-w-3xl md:grid-cols-2 xl:grid-rows-2 md:grid-rows-3 xl:max-w-6xl xl:auto-rows-fr xl:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className={cn(
              "group relative items-start overflow-hidden bg-neutral-50 dark:bg-neutral-800 p-6 rounded-2xl",
              feature.className
            )}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: index * 0.1,
            }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-semibold mb-2 text-primary">
                {feature.title}
              </h3>
              <p className="text-foreground">{feature.description}</p>
            </div>
            {feature.content}
            <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-neutral-50 dark:from-neutral-900 pointer-events-none"></div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
