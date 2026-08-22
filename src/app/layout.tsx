import { TailwindIndicator } from "@/components/tailwind-indicator";
import { StructuredData } from "@/components/structured-data";
import { cn, constructMetadata } from "@/lib/utils";
import { type Metadata, Viewport } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { MaintenanceNotice } from "@/components/maintenance-notice";
import { ConsentManagedTracking } from "@/components/consent-managed-tracking";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = constructMetadata({});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
        <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://rsms.me/" />
          <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
          <StructuredData type="website" />
          <StructuredData type="software" />
        </head>
        <body
          className={cn(
            "min-h-screen bg-background antialiased w-full mx-auto scroll-smooth",
            inter.variable
          )}
        >
            <MaintenanceNotice />
            {children}
            <ConsentManagedTracking gaId="G-W5G449QF3Y" />
        </body>
      </html>
    </ClerkProvider>
  );
}
