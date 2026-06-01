"use client";

export const dynamic = 'force-dynamic';

import Header from "@/components/sections/header";
import Section from "@/components/section";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { sendGAEvent } from "@next/third-parties/google";
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
import { HiSparkles } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import CheckoutButton from "@/components/checkout-button";

// Declare global twq function for Twitter pixel
declare global {
  interface Window {
    twq: (action: string, eventId: string, params?: any) => void;
  }
}

type DetectedOS = "mac" | "windows" | "linux" | "unknown";

/**
 * OS detection from the browser. Runs only after mount so SSR + client agree
 * on a "unknown" default before hydration. We pick the most likely match
 * given userAgent + platform; users can always override via the
 * "Other platforms" links below the main button.
 */
function detectOS(): DetectedOS {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  // Prefer Mac/Win/Linux exclusivity. ARM/Intel doesn't matter for the
  // download URL — we ship a single artifact per platform.
  if (/Mac|iPhone|iPad|iPod/i.test(ua)) return "mac";
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux|X11/i.test(ua)) return "linux";
  return "unknown";
}

const OS_LABELS: Record<DetectedOS, string> = {
  mac: "macOS",
  windows: "Windows",
  linux: "Linux",
  unknown: "your computer",
};

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
  const [showWindowsModal, setShowWindowsModal] = useState(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleMacDownload = () => {
    const downloadLink =
      "https://s3consolemac.s3.ap-south-1.amazonaws.com/S3Console-2.6.7-arm64-mac.zip";

    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "S3Console-2.6.7-arm64-mac.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "mac_download",
      });
    }

    sendGAEvent("event", "download_clicked", {
      os: 'macOS',
      version: '2.6.7-arm64'
    });

    showNotification(downloadLink);
  };

  const handleLinuxDownload = () => {
    const downloadLink =
      "https://s3consolelinux.s3.ap-south-1.amazonaws.com/s3Console_2.6.7_amd64.deb";

    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "s3Console_2.6.7_amd64.deb";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "linux_download",
      });
    }

    sendGAEvent("event", "download_clicked", {
      os: "Linux",
      version: "2.6.7-amd64",
    });

    showNotification(downloadLink);
  };

  const handleWindowsDownload = () => {
    setShowWindowsModal(true);
  };

  const proceedWithWindowsDownload = () => {
    setShowWindowsModal(false);
    const downloadLink =
      "https://s3consolewindows.s3.ap-south-1.amazonaws.com/S3Console-Setup-2.6.7.exe";

    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "S3Console-Setup-2.6.7.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "windows_download",
      });
    }

    sendGAEvent("event", "download_clicked", {
      os: 'Windows',
      version: '2.6.7'
    });

    showNotification(downloadLink);
  };

  const showNotification = (downloadLink: string) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed bottom-8 right-8 bg-slate-900 text-white p-6 rounded-lg shadow-xl z-50 max-w-md animate-in slide-in-from-bottom";
    notification.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-semibold mb-1">Download Started!</p>
          <p class="text-sm text-slate-300 mb-2">Your S3Console download should begin shortly.</p>
          <p class="text-xs text-slate-400">If the download doesn't start automatically, <a href="${downloadLink}" class="text-primary hover:underline">click here</a>.</p>
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
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Windows Safety Modal */}
        <Dialog open={showWindowsModal} onOpenChange={setShowWindowsModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FaWindows className="h-6 w-6 text-blue-600" />
                Windows Download Safety
              </DialogTitle>
              <DialogDescription className="pt-4 text-base space-y-4 text-left">
                <p className="text-slate-700">
                  You may see a warning from Windows SmartScreen saying this file isn't commonly downloaded.
                </p>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                  <p className="font-semibold text-blue-800 mb-1 flex items-center gap-2">
                    <FaCheck className="h-4 w-4" />
                    S3Console is 100% Safe
                  </p>
                  <p className="text-sm text-blue-700">
                    We are a new verified publisher, so Microsoft is still building trust with our certificate. This warning is a standard security check for new software.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-slate-900">If you see a warning:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-600">
                    <li>Click <span className="font-semibold">Keep</span> or the <span className="font-semibold">...</span> menu on the download</li>
                    <li>Select <span className="font-semibold">Keep anyway</span> if prompted</li>
                    <li>When opening the installer, click <span className="font-semibold">More info</span> &rarr; <span className="font-semibold">Run anyway</span></li>
                  </ol>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-between gap-2 mt-2">
              <Button
                variant="ghost"
                onClick={() => setShowWindowsModal(false)}
                className="mt-2 sm:mt-0"
              >
                Cancel
              </Button>
              <Button
                onClick={proceedWithWindowsDownload}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                I Understand, Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Success Modal */}
        {paymentSuccess && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <FaCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-slate-600 mb-6">
                Your S3Console Pro license is now active
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> Please log out and log back in to
                  the desktop app to activate your Pro license.
                </p>
              </div>
              <Button
                onClick={() => setPaymentSuccess(false)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        <Section className="py-20">
          {/* HERO — centered single download CTA, OS auto-detected */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Download S3Console
            </h1>
            <p className="text-base md:text-lg text-slate-600 mb-2">
              Your 14-day free trial starts the moment you launch the app. No
              credit card. No signup.
            </p>
            <p className="text-sm text-slate-500 mb-10">
              Trial is locked to your machine — full access to every feature.
            </p>

            {/* Primary download — big, centered */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={() => {
                  if (detectedOS === "windows") handleWindowsDownload();
                  else if (detectedOS === "linux") handleLinuxDownload();
                  else handleMacDownload(); // default to mac for "unknown"
                }}
                className="h-14 px-10 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {detectedOS === "windows" ? (
                  <FaWindows className="mr-3 h-5 w-5" />
                ) : detectedOS === "linux" ? (
                  <FaLinux className="mr-3 h-5 w-5" />
                ) : (
                  <FaApple className="mr-3 h-5 w-5" />
                )}
                Download for {OS_LABELS[detectedOS] === "your computer" ? "macOS" : OS_LABELS[detectedOS]}
                <FaDownload className="ml-3 h-4 w-4" />
              </Button>

              <p className="text-xs text-slate-500 mt-1">
                Free · 14-day trial · macOS, Windows, Linux
              </p>
            </div>

            {/* Secondary OS picks — small links underneath */}
            <div className="mt-10 pt-8 border-t border-slate-200/60 max-w-xl mx-auto">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide font-medium">
                Or pick your platform
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
                <button
                  type="button"
                  onClick={handleMacDownload}
                  className="inline-flex items-center gap-2 text-slate-700 hover:text-primary transition-colors"
                >
                  <FaApple className="h-4 w-4" />
                  macOS
                  <span className="text-xs text-slate-400">(.zip, ARM64)</span>
                </button>
                <button
                  type="button"
                  onClick={handleWindowsDownload}
                  className="inline-flex items-center gap-2 text-slate-700 hover:text-primary transition-colors"
                >
                  <FaWindows className="h-4 w-4" />
                  Windows
                  <span className="text-xs text-slate-400">(.exe, 10/11)</span>
                </button>
                <button
                  type="button"
                  onClick={handleLinuxDownload}
                  className="inline-flex items-center gap-2 text-slate-700 hover:text-primary transition-colors"
                >
                  <FaLinux className="h-4 w-4" />
                  Linux
                  <span className="text-xs text-slate-400">(.deb, AMD64)</span>
                </button>
              </div>
            </div>

            {/* What happens next — three quick reassurances */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { icon: FaDownload, title: "Download", body: "Installer for your OS" },
                { icon: FaCheck, title: "Install & open", body: "Trial starts automatically" },
                { icon: HiSparkles, title: "14 days free", body: "Pick a plan only if it fits" },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-left"
                >
                  <Icon className="h-4 w-4 text-primary mb-2" />
                  <p className="text-sm font-semibold text-slate-900">
                    {title}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User Dashboard */}
          {userData && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-12">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <FaUser className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      Your Account
                    </h2>
                    <p className="text-slate-600">
                      License and download information
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={refreshUserData}
                      disabled={refreshing}
                      className="p-2 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
                      title="Refresh account data"
                    >
                      <FaSync className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    {userData.paid && (
                      <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        <FaCrown className="h-4 w-4" />
                        Pro License
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning Banner */}
              {warningMessage && (
                <div className={`px-8 py-4 border-b ${requiresActivation
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
                  }`}>
                  <div className="flex items-start gap-3">
                    {requiresActivation ? (
                      <FaExclamationTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <FaInfoCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${requiresActivation
                        ? 'text-amber-800'
                        : 'text-blue-800'
                        }`}>
                        {warningMessage}
                      </p>
                      {requiresActivation && (
                        <p className="text-xs text-amber-700 mt-1">
                          Open the S3Console desktop app and activate your license with your email and license key to register this machine.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FaUser className="h-5 w-5 text-primary" />
                    User Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <FaUser className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">
                          Name
                        </p>
                        <p className="font-medium text-slate-900">
                          {userData.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <FaEnvelope className="h-4 w-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-500">
                          Email
                        </p>
                        <p className="font-medium text-slate-900">
                          {userData.email}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(userData.email, 'email')}
                        className="ml-auto p-2 hover:bg-slate-200 rounded-md transition-colors"
                        title="Copy email"
                      >
                        {copiedEmail ? (
                          <FaCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <FaCopy className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FaKey className="h-5 w-5 text-primary" />
                    License Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <FaKey className="h-4 w-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-500">
                          License Key
                        </p>
                        <p className="font-mono text-sm text-slate-900 break-all">
                          {userData.key}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(userData.key, 'key')}
                        className="ml-auto p-2 hover:bg-slate-200 rounded-md transition-colors"
                        title="Copy license key"
                      >
                        {copiedKey ? (
                          <FaCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <FaCopy className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div
                        className={`h-3 w-3 rounded-full ${userData.paid ? "bg-green-500" : "bg-amber-500"
                          }`}
                      ></div>
                      <div>
                        <p className="text-sm text-slate-500">
                          Status
                        </p>
                        <p
                          className={`font-medium ${userData.paid ? "text-green-600" : "text-amber-600"
                            }`}
                        >
                          {userData.paid
                            ? "Pro License Active"
                            : "Trial Version"}
                        </p>
                      </div>
                    </div>
                    {userData.paid && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <div>
                          <p className="text-sm text-slate-500">Devices</p>
                          <p className="font-medium text-slate-900">
                            Use your license on up to {userData.licenseCount || 2} machines — same license key on each.
                          </p>
                        </div>
                      </div>
                    )}
                    {userData.paid && (
                      <Link
                        href="/account/billing"
                        className="flex items-center justify-between p-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <FaCrown className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              Manage subscription
                            </p>
                            <p className="text-xs text-slate-500">
                              Cancel, upgrade, or update payment method
                            </p>
                          </div>
                        </div>
                        <span className="text-primary group-hover:translate-x-0.5 transition-transform">→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Machine Management Section */}
              {userData.paid && (
                <div className="border-t border-slate-200 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <FaDesktop className="h-5 w-5 text-primary" />
                      Registered Machines
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${(userData.machines?.length || 0) >= (userData.licenseCount || 2)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {userData.machines?.length || 0} / {userData.licenseCount || 2}
                      </span>
                    </div>
                  </div>

                  {/* License Usage Info */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">
                      Your license activates on up to <strong className="text-slate-900">{userData.licenseCount || 2}</strong> machines.{" "}
                      Use your <strong className="text-slate-900">same license key</strong> on each — no separate keys.
                    </p>
                  </div>

                  {userData.machines && Array.isArray(userData.machines) && userData.machines.length > 0 ? (
                    <div className="space-y-2">
                      {userData.machines.map((machineId: string, index: number) => (
                        <div
                          key={machineId}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-green-100' : 'bg-blue-100'
                              }`}>
                              <FaDesktop className={`h-4 w-4 ${index === 0 ? 'text-green-600' : 'text-blue-600'
                                }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">
                                Machine {index + 1}
                                {index === 0 && userData.machines.length === 1 && (
                                  <span className="ml-2 text-xs text-green-600">(Primary)</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 font-mono truncate" title={machineId}>
                                {machineId}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeregisterMachine(machineId)}
                            disabled={deletingMachine === machineId}
                            className="ml-3 p-2 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                            title="Deregister machine"
                          >
                            {deletingMachine === machineId ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <FaTrash className="h-4 w-4 text-red-600" />
                            )}
                          </button>
                        </div>
                      ))}

                      {/* Show if at device limit */}
                      {(userData.machines.length >= (userData.licenseCount || 2)) && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            <FaExclamationTriangle className="inline h-4 w-4 mr-2" />
                            You've reached the {userData.licenseCount || 2}-machine limit. Deregister a device above to free a slot.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <FaDesktop className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium mb-1">No machines registered yet</p>
                      <p className="text-sm mt-2">
                        {requiresActivation ? (
                          <>
                            Activate your license in the desktop app to register this machine.
                            <br />
                            <span className="text-xs mt-1 block">Use your email: <code className="bg-slate-200 px-1 rounded">{userData.email}</code> and license key shown above.</span>
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
          {!userData?.paid && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white text-center">
                  <FaCrown className="h-10 w-10 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold mb-1">
                    Unlock S3Console Pro
                  </h3>
                  <p className="text-base opacity-90">
                    One-time payment, lifetime access
                  </p>
                </div>

                <div className="p-6 space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Please note: depending on your country's tax rules, additional VAT/GST may be added at checkout.
                  </p>
                  <Link
                    href="/pricing"
                    className="block w-full bg-primary hover:bg-primary/90 text-white text-center py-3 rounded-md font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    See plans &amp; pricing
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    Monthly $9 · Yearly $49 · Lifetime $99
                  </p>
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
