"use client";

export const dynamic = 'force-dynamic';

import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { sendGAEvent } from "@next/third-parties/google";
import { trackReddit } from "@/lib/reddit";
import {
  FaWindows,
  FaApple,
  FaLinux,
  FaDownload,
  FaCrown,
  FaKey,
  FaUser,
  FaEnvelope,
  FaCheck,
  FaCopy,
  FaTrash,
  FaDesktop,
  FaSync,
  FaExclamationTriangle,
  FaInfoCircle,
  FaPlus,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import CheckoutButton from "@/components/checkout-button";

// Declare global twq function for Twitter pixel
declare global {
  interface Window {
    twq: (action: string, eventId: string, params?: any) => void;
  }
}

type DetectedOS = "mac" | "windows" | "linux" | "mobile" | "unknown";

/**
 * OS detection from the browser. Runs only after mount so SSR + client agree
 * on a "unknown" default before hydration. We pick the most likely match
 * given userAgent + platform; users can always override via the
 * "Other platforms" links below the main button.
 */
function detectOS(): DetectedOS {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  // Phones and tablets can't run the desktop app. Check them first: Android
  // user agents contain "Linux" and iOS ones contain "Mac".
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return "mobile";
  // Prefer Mac/Win/Linux exclusivity. ARM/Intel doesn't matter for the
  // download URL — we ship a single artifact per platform.
  if (/Mac/i.test(ua)) return "mac";
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux|X11/i.test(ua)) return "linux";
  return "unknown";
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="lg"
      variant="outline"
      className="mt-4 w-full rounded-full"
      onClick={() => {
        void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true));
      }}
    >
      {copied ? "Link copied" : "Copy download link"}
    </Button>
  );
}

const OS_LABELS: Record<DetectedOS, string> = {
  mac: "macOS",
  windows: "Windows",
  linux: "Linux",
  mobile: "your computer",
  unknown: "your computer",
};

// Partner Center product identities are permanent and public. Keeping the
// canonical URL in source prevents a missing deployment variable from sending
// Windows customers to a stale "coming soon" state after Store publication.
const windowsInstallerUrl = "https://s3consolewindows.s3.ap-south-1.amazonaws.com/latest/Buckets-windows-x64.exe";
const windowsStoreUrl = "https://apps.microsoft.com/detail/9N62S7QSHBDN";

// Shared class names so the downloads page matches the premium theme used on
// the homepage and pricing (.theme-scope, copper accent, rounded-full CTAs).
const PRIMARY_CTA_CLASS =
  "h-14 rounded-full px-10 text-base font-semibold transition-transform hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_12px_40px_-10px_hsl(var(--primary)/0.7)]";
const PLATFORM_CHIP_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-foreground transition-colors hover:border-primary/40 hover:bg-foreground/[0.06]";
const FIELD_ROW_CLASS = "flex items-center gap-3 rounded-xl bg-foreground/[0.03] p-3";
const COPY_BUTTON_CLASS =
  "ml-auto rounded-md p-2 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground";

//checking
export default function DownloadsPage() {
  const { userId, isLoaded } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false); // Kept for compatibility if needed, but CheckoutButton handles its own state
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deletingMachine, setDeletingMachine] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [requiresActivation, setRequiresActivation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detectedOS, setDetectedOS] = useState<DetectedOS>("unknown");

  // Run OS detection once on mount. Avoids SSR mismatch — server renders
  // "unknown" and the button label updates as soon as the page hydrates.
  useEffect(() => {
    setDetectedOS(detectOS());
  }, []);

  const userDataRef = useRef(userData);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  useEffect(() => {
    // Wait for Clerk to load before deciding what to render.
    if (!isLoaded) return;

    // Anonymous visitors can download — the desktop app gives them a 14-day
    // machine-locked trial automatically with no signup. We just don't
    // populate userData (license info section stays hidden).
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user-data");
        const data = await response.json();
        if (response.ok && data.success) {
          setUserData(data.userData);
          setWarningMessage(data.warning ?? null);
          setRequiresActivation(!!data.requiresActivation);
        } else {
          // Logged-in but no row yet (just signed up, webhook still propagating).
          // Don't alert — let them download, they'll see their license info on next refresh.
        }
      } catch {
        // Swallow fetch errors — user can refresh to retry.
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, isLoaded]);

  useEffect(() => {
    // Track page view with user metadata
    if (userId && userData) {
      sendGAEvent("event", "downloads_page_viewed", {
        has_license: userData.paid
      });
    }
  }, [userId, userData]);

  // The page itself renders immediately (and server-side) for everyone;
  // only the signed-in license panel waits for the account lookup.

  const handleMacDownload = () => {
    const downloadLink =
      "https://s3consolemac.s3.us-east-1.amazonaws.com/latest/Buckets-mac-arm64.zip";

    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "Buckets-mac-arm64.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "mac_download",
      });
    }

    // Reddit activation signal — a download is the key intent event for a
    // desktop product.
    trackReddit("Lead", { conversionId: "mac_download" });

    sendGAEvent("event", "download_clicked", {
      os: 'macOS',
      release_channel: "latest",
    });

    showNotification(downloadLink);
  };

  const handleLinuxDownload = () => {
    const downloadLink =
      "https://s3consolelinux.s3.ap-south-1.amazonaws.com/latest/Buckets-linux-x64.deb";

    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "Buckets-linux-x64.deb";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "linux_download",
      });
    }

    // Reddit activation signal — a download is the key intent event for a
    // desktop product.
    trackReddit("Lead", { conversionId: "linux_download" });

    sendGAEvent("event", "download_clicked", {
      os: "Linux",
      release_channel: "latest",
    });

    showNotification(downloadLink);
  };

  const handleWindowsStore = () => {
    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "windows_store",
      });
    }
    trackReddit("Lead", { conversionId: "windows_store" });

    sendGAEvent("event", "download_clicked", {
      os: 'Windows',
      release_channel: "microsoft-store",
    });
  };

  const showNotification = (downloadLink: string) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed bottom-8 right-8 bg-foreground text-background p-6 rounded-lg shadow-xl z-50 max-w-md animate-in slide-in-from-bottom";
    notification.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-semibold mb-1">Download Started!</p>
          <p class="text-sm opacity-80 mb-2">Your Buckets by ServerlessCreed download should begin shortly.</p>
          <p class="text-xs opacity-60">If the download doesn't start automatically, <a href="${downloadLink}" class="text-amber-300 underline underline-offset-2 hover:text-amber-200">click here</a>.</p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("animate-out", "slide-out-to-bottom");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 8000);
  };

  const copyToClipboard = async (text: string, type: 'email' | 'key') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    } catch {
      // Clipboard write failed — silently ignore.
    }
  };

  const handleDeregisterMachine = async (machineId: string) => {
    if (!confirm(`Are you sure you want to deregister this machine? You'll need to register it again to use it.`)) {
      return;
    }

    try {
      setDeletingMachine(machineId);
      const response = await fetch("/api/deregister-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData?.email,
          machineId: machineId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to deregister machine");
      }

      await refreshUserData();
    } catch (error) {
      alert((error as Error).message || "Failed to deregister machine. Please try again.");
    } finally {
      setDeletingMachine(null);
    }
  };

  const refreshUserData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/user-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUserData(data.userData);
        if (data.warning) {
          setWarningMessage(data.warning);
        } else {
          setWarningMessage(null);
        }
        if (data.requiresActivation) {
          setRequiresActivation(true);
        } else {
          setRequiresActivation(false);
        }
      }
    } catch {
      // Refresh failed — user can retry by clicking refresh again.
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="theme-scope min-h-screen">
      <Header />

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-frame">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <FaCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
              Payment Successful!
            </h3>
            <p className="mb-6 text-muted-foreground">
              Your Buckets by ServerlessCreed Pro license is now active
            </p>
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <strong>Important:</strong> Please log out and log back in to
                the desktop app to activate your Pro license.
              </p>
            </div>
            <Button onClick={() => setPaymentSuccess(false)} className="rounded-full px-7">
              Continue
            </Button>
          </div>
        </div>
      )}

      <main className="relative isolate overflow-hidden">
        <div aria-hidden className="bg-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />

        <div className="mx-auto max-w-5xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          {/* HERO — centered single download CTA, OS auto-detected */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Download
            </p>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              <span className="text-gradient">Download Buckets by ServerlessCreed</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Your 14-day free trial starts the moment you launch the app. No
              credit card. No signup.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              14 days to try your own workflows before choosing a plan.
            </p>

            {/* Primary download — big, centered */}
            <div className="mt-10 flex flex-col items-center gap-4">
              {detectedOS === "mobile" ? (
                <div className="surface w-full max-w-md rounded-2xl p-6 text-left">
                  <p className="font-semibold text-foreground">Buckets is a desktop app</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    It runs on macOS, Windows and Linux. Open this page on your
                    computer to download it, or copy the link to send it to yourself.
                  </p>
                  <CopyLinkButton />
                </div>
              ) : detectedOS === "windows" ? (
                <Button
                  asChild
                  size="lg"
                  className={PRIMARY_CTA_CLASS}
                >
                  <a
                    href={windowsStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWindowsStore}
                  >
                    <FaWindows className="mr-3 h-5 w-5" />
                    Get from Microsoft Store
                  </a>
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={detectedOS === "linux" ? handleLinuxDownload : handleMacDownload}
                  className={PRIMARY_CTA_CLASS}
                >
                  {detectedOS === "linux" ? (
                    <FaLinux className="mr-3 h-5 w-5" />
                  ) : (
                    <FaApple className="mr-3 h-5 w-5" />
                  )}
                  <>
                    Download for {OS_LABELS[detectedOS] === "your computer" ? "macOS" : OS_LABELS[detectedOS]}
                    <FaDownload className="ml-3 h-4 w-4" />
                  </>
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                Free · 14-day trial · macOS, Windows, Linux
              </p>
            </div>

            {/* Secondary OS picks — small links underneath */}
            <div className="mx-auto mt-12 max-w-2xl border-t border-border pt-8">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Or pick your platform
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={handleMacDownload}
                  className={PLATFORM_CHIP_CLASS}
                >
                  <FaApple className="h-4 w-4" />
                  macOS
                  <span className="text-xs text-muted-foreground">(.zip, ARM64)</span>
                </button>
                <a
                  href={windowsStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWindowsStore}
                  className={PLATFORM_CHIP_CLASS}
                >
                  <FaWindows className="h-4 w-4" />
                  Windows
                  <span className="text-xs text-muted-foreground">(Microsoft Store)</span>
                </a>
                <button
                  type="button"
                  onClick={handleLinuxDownload}
                  className={PLATFORM_CHIP_CLASS}
                >
                  <FaLinux className="h-4 w-4" />
                  Linux
                  <span className="text-xs text-muted-foreground">(.deb, AMD64)</span>
                </button>
              </div>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
              Install Buckets for Windows through the{" "}
              <a
                href={windowsStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWindowsStore}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Microsoft Store
              </a>{" "}
              for Store-managed updates, or{" "}
              <a href={windowsInstallerUrl} className="underline underline-offset-2 hover:text-foreground">download the Windows installer (.exe, x64)</a>.
              {" "}For details on credential storage, data handling, and current security assurance, see our{" "}
              <Link href="/trust" className="underline underline-offset-2 hover:text-foreground">Trust Center</Link>.
            </p>

            {/* What happens next — three quick reassurances */}
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: FaDownload, title: "Install & open", body: "Choose the package for your OS" },
                { icon: FaKey, title: "Connect an account", body: "Use an AWS CLI profile or IAM Identity Center" },
                { icon: FaCheck, title: "Browse & transfer", body: "Choose a bucket and try a small file" },
              ].map(({ icon: Icon, title, body }, i) => (
                <div
                  key={title}
                  className="surface rounded-2xl p-5 text-left transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User Dashboard */}
          {loading && !!userId && (
            <div aria-busy="true" aria-label="Loading your license" className="mx-auto mb-12 h-48 max-w-4xl animate-pulse rounded-2xl bg-muted" />
          )}
          {userData && (
            <div className="surface mb-12 overflow-hidden rounded-2xl">
              <div className="border-b border-border bg-gradient-to-r from-primary/[0.10] to-primary/[0.03] px-6 py-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                    <FaUser className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                      Your Account
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      License and download information
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={refreshUserData}
                      disabled={refreshing}
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-50"
                      title="Refresh account data"
                    >
                      <FaSync className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    {userData.paid && (
                      <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/25">
                        <FaCrown className="h-4 w-4" />
                        Pro License
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning Banner */}
              {warningMessage && (
                <div className={`border-b px-6 py-4 sm:px-8 ${requiresActivation
                  ? 'border-amber-500/30 bg-amber-500/[0.08]'
                  : 'border-sky-500/25 bg-sky-500/[0.07]'
                  }`}>
                  <div className="flex items-start gap-3">
                    {requiresActivation ? (
                      <FaExclamationTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <FaInfoCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600 dark:text-sky-400" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${requiresActivation
                        ? 'text-amber-900 dark:text-amber-200'
                        : 'text-sky-900 dark:text-sky-200'
                        }`}>
                        {warningMessage}
                      </p>
                      {requiresActivation && (
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                          Open the Buckets by ServerlessCreed desktop app and activate your license with your email and license key to register this machine.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <FaUser className="h-4 w-4 text-primary" />
                    User Information
                  </h3>
                  <div className="space-y-3">
                    <div className={FIELD_ROW_CLASS}>
                      <FaUser className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium text-foreground">{userData.name}</p>
                      </div>
                    </div>
                    <div className={FIELD_ROW_CLASS}>
                      <FaEnvelope className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">{userData.email}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(userData.email, 'email')}
                        className={COPY_BUTTON_CLASS}
                        title="Copy email"
                      >
                        {copiedEmail ? (
                          <FaCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FaCopy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <FaKey className="h-4 w-4 text-primary" />
                    License Information
                  </h3>
                  <div className="space-y-3">
                    <div className={FIELD_ROW_CLASS}>
                      <FaKey className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">License Key</p>
                        <p className="break-all font-mono text-sm text-foreground">{userData.key}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(userData.key, 'key')}
                        className={COPY_BUTTON_CLASS}
                        title="Copy license key"
                      >
                        {copiedKey ? (
                          <FaCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FaCopy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className={FIELD_ROW_CLASS}>
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${userData.paid ? "bg-emerald-500" : "bg-amber-500"}`}
                      ></div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p
                          className={`font-medium ${userData.paid
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-300"
                            }`}
                        >
                          {userData.paid ? "Pro License Active" : "Trial Version"}
                        </p>
                      </div>
                    </div>
                    {userData.paid && (
                      <div className={FIELD_ROW_CLASS}>
                        <div className="h-2.5 w-2.5 rounded-full bg-sky-500"></div>
                        <div>
                          <p className="text-sm text-muted-foreground">Devices</p>
                          <p className="font-medium text-foreground">
                            Use your license on up to {userData.licenseCount || 2} machines — same license key on each.
                          </p>
                        </div>
                      </div>
                    )}
                    {userData.paid && (
                      <Link
                        href="/account/billing"
                        className="group flex items-center justify-between rounded-xl border border-primary/25 bg-primary/[0.06] p-3 transition-colors hover:bg-primary/[0.10]"
                      >
                        <div className="flex items-center gap-3">
                          <FaCrown className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Manage subscription</p>
                            <p className="text-xs text-muted-foreground">
                              Cancel, upgrade, or update payment method
                            </p>
                          </div>
                        </div>
                        <span className="text-primary transition-transform group-hover:translate-x-0.5">→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Machine Management Section */}
              {userData.paid && (
                <div className="border-t border-border p-6 sm:p-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <FaDesktop className="h-4 w-4 text-primary" />
                      Registered Machines
                    </h3>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${(userData.machines?.length || 0) >= (userData.licenseCount || 2)
                      ? 'bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-400'
                      : 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400'
                      }`}>
                      {userData.machines?.length || 0} / {userData.licenseCount || 2}
                    </span>
                  </div>

                  {/* License Usage Info */}
                  <div className="mb-4 rounded-xl bg-foreground/[0.03] p-3">
                    <p className="text-xs text-muted-foreground">
                      Your license activates on up to <strong className="text-foreground">{userData.licenseCount || 2}</strong> machines.{" "}
                      Use your <strong className="text-foreground">same license key</strong> on each — no separate keys.
                    </p>
                  </div>

                  {userData.machines && Array.isArray(userData.machines) && userData.machines.length > 0 ? (
                    <div className="space-y-2">
                      {userData.machines.map((machineId: string, index: number) => (
                        <div
                          key={machineId}
                          className="flex items-center justify-between rounded-xl bg-foreground/[0.03] p-3 transition-colors hover:bg-foreground/[0.06]"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${index === 0 ? 'bg-emerald-500/10' : 'bg-sky-500/10'}`}>
                              <FaDesktop className={`h-4 w-4 ${index === 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-sky-600 dark:text-sky-400'
                                }`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">
                                Machine {index + 1}
                                {index === 0 && userData.machines.length === 1 && (
                                  <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">(Primary)</span>
                                )}
                              </p>
                              <p className="truncate font-mono text-xs text-muted-foreground" title={machineId}>
                                {machineId}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeregisterMachine(machineId)}
                            disabled={deletingMachine === machineId}
                            className="ml-3 flex-shrink-0 rounded-md p-2 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                            title="Deregister machine"
                          >
                            {deletingMachine === machineId ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                            ) : (
                              <FaTrash className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                          </button>
                        </div>
                      ))}

                      {/* Show if at device limit */}
                      {(userData.machines.length >= (userData.licenseCount || 2)) && (
                        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-3">
                          <p className="text-sm text-amber-900 dark:text-amber-200">
                            <FaExclamationTriangle className="mr-2 inline h-4 w-4" />
                            You've reached the {userData.licenseCount || 2}-machine limit. Deregister a device above to free a slot.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <FaDesktop className="mx-auto mb-3 h-12 w-12 opacity-50" />
                      <p className="mb-1 font-medium">No machines registered yet</p>
                      <p className="mt-2 text-sm">
                        {requiresActivation ? (
                          <>
                            Activate your license in the desktop app to register this machine.
                            <br />
                            <span className="mt-1 block text-xs">Use your email: <code className="rounded bg-foreground/[0.08] px-1">{userData.email}</code> and license key shown above.</span>
                          </>
                        ) : (
                          "Register a machine when you activate your license in the desktop app."
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Purchase Section - Only shown if NOT paid */}
          {!loading && !userData?.paid && (
            <div className="mx-auto max-w-xl">
              <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/[0.10] to-transparent p-8 text-center shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <FaCrown className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  Unlock Buckets by ServerlessCreed Pro
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Monthly, yearly, lifetime or team. Every plan includes every feature.
                </p>
                <Link
                  href="/pricing"
                  className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_12px_40px_-10px_hsl(var(--primary)/0.7)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  See plans &amp; pricing
                </Link>
                <p className="mt-4 text-xs text-muted-foreground">
                  Monthly $5 · Yearly $49 · Lifetime $99
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Depending on your country&apos;s tax rules, additional VAT/GST may be added at checkout.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
