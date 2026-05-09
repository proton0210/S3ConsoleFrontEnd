import { TailwindIndicator } from "@/components/tailwind-indicator";
import { StructuredData } from "@/components/structured-data";
import { cn, constructMetadata } from "@/lib/utils";
import { type Metadata, Viewport } from "next";
import { CSPostHogProvider } from "@/components/posthog-provider";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  axes: ["opsz", "SOFT"],
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
      <CSPostHogProvider>
        <html lang="en" suppressHydrationWarning>
        <head>
          <StructuredData type="website" />
          <StructuredData type="software" />
          {/* Twitter conversion tracking base code */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
                },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
                a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
                twq('config','pyshe');
              `,
            }}
          />
          {/* End Twitter conversion tracking base code */}
        </head>
        <body
          className={cn(
            "min-h-screen bg-background text-foreground antialiased w-full mx-auto scroll-smooth font-mono",
            jetbrainsMono.variable,
            fraunces.variable
          )}
        >
            {children}
        </body>
      </html>
      </CSPostHogProvider>
    </ClerkProvider>
  );
}
