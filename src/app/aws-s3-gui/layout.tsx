import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "AWS S3 GUI for Mac, Windows & Linux — S3Console",
  description:
    "Need an AWS S3 GUI? S3Console is a native desktop S3 GUI client for macOS, Windows, and Linux — drag-and-drop uploads, multi-profile SSO, presigned URLs, and a visual policy editor. Free 14-day trial.",
  canonical: "/aws-s3-gui",
});

export default function AwsS3GuiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
