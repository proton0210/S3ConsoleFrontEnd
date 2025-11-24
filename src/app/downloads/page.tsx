"use client";
import Header from "@/components/sections/header";
import Section from "@/components/section";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { usePostHog } from "posthog-js/react";
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
import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import CheckoutButton from "@/components/checkout-button";

// Declare global twq function for Twitter pixel
declare global {
  interface Window {
    twq: (action: string, eventId: string, params?: any) => void;
  }
}

//checking
export default function DownloadsPage() {
  const { userId } = useAuth();
  const posthog = usePostHog();
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
  
  const userDataRef = useRef(userData);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  useEffect(() => {
    if (!userId) {
      redirect("/sign-in");
    }

    const fetchUserData = async () => {
      try {
        console.log("Fetching user data for userId:", userId);
        setLoading(true);

        const response = await fetch("/api/user-data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("User data API response status:", response.status);
        const data = await response.json();
        console.log("User data API response:", data);

        if (response.ok && data.success) {
          console.log("User data fetched successfully:", data.userData);
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
        } else {
          console.error(
            "Failed to fetch user data:",
            data.error || "Unknown error"
          );
          
          alert(
            `Failed to load user data: ${
              data.error || "Unknown error"
            }. Please refresh the page.`
          );
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert(
          "Failed to load user data. Please refresh the page and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    // Track page view with user metadata
    if (userId && userData) {
      posthog.identify(userId, {
        email: userData.email,
        name: userData.name,
        is_paid: userData.paid,
        license_count: userData.licenseCount
      });
      
      posthog.capture('downloads_page_viewed', {
        has_license: userData.paid
      });
    }
  }, [userId, userData, posthog]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleMacDownload = () => {
    const downloadLink =
      "https://s3consolemac.s3.us-east-1.amazonaws.com/S3Console-1.0.70-arm64.dmg";

    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "S3Console-1.0.66-arm64.dmg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "mac_download",
      });
    }

    posthog.capture('download_clicked', {
      os: 'macOS',
      version: '1.0.70-arm64'
    });

    showNotification(downloadLink);
  };

  const handleWindowsDownload = () => {
    const downloadLink =
      "https://s3consolewindows.s3.ap-south-1.amazonaws.com/S3Console-Setup-1.0.70.exe";

    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "S3Console-Setup-1.0.66.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "windows_download",
      });
    }

    posthog.capture('download_clicked', {
      os: 'Windows',
      version: '1.0.70'
    });

    showNotification(downloadLink);
  };

  const handleLinuxDownload = () => {
    const downloadLink =
      "https://s3consolelinux.s3.ap-south-1.amazonaws.com/s3Console_1.0.74_amd64.deb";

    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "s3Console_1.0.74_amd64.deb";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "linux_download",
      });
    }

    posthog.capture('download_clicked', {
      os: 'Linux',
      version: '1.0.74_amd64'
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
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
      console.error("Failed to deregister machine:", error);
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
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Payment Success Modal */}
        {paymentSuccess && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full mb-6">
                <FaCheck className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your S3Console Pro license is now active
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-200">
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
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <HiSparkles className="h-4 w-4" />
              S3Console Downloads
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
              Get Started with S3Console
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Download the desktop application and manage your AWS S3 buckets
              with ease
            </p>
          </div>

          {/* Download Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
            {/* Windows Card */}
            <div className="group relative overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 bg-white dark:bg-slate-800 hover:border-primary/30">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FaWindows className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Windows
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Windows 10/11 (64-bit)
                </p>
                <Button
                  onClick={handleWindowsDownload}
                  className="w-full bg-primary hover:bg-primary/90 text-white group-hover:shadow-lg transition-all duration-300"
                >
                  <FaDownload className="mr-2 h-4 w-4" />
                  Download for Windows
                </Button>
              </div>
            </div>

            {/* macOS Card */}
            <div className="group relative overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 bg-white dark:bg-slate-800 hover:border-primary/30">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FaApple className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  macOS
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  macOS 10.15+ (Intel & Apple Silicon)
                </p>
                <Button
                  onClick={handleMacDownload}
                  className="w-full bg-primary hover:bg-primary/90 text-white group-hover:shadow-lg transition-all duration-300"
                >
                  <FaDownload className="mr-2 h-4 w-4" />
                  Download for macOS
                </Button>
              </div>
            </div>

            {/* Linux Card */}
            <div className="group relative overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 bg-white dark:bg-slate-800 hover:border-primary/30">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FaLinux className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Linux
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Ubuntu &amp; other major distributions
                </p>
                <Button
                  onClick={handleLinuxDownload}
                  className="w-full bg-primary hover:bg-primary/90 text-white group-hover:shadow-lg transition-all duration-300"
                >
                  <FaDownload className="mr-2 h-4 w-4" />
                  Download for Linux
                </Button>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Debian/Ubuntu (.deb package)
                </p>
              </div>
            </div>
          </div>

          {/* User Dashboard */}
          {userData && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-12">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <FaUser className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Your Account
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      License and download information
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={refreshUserData}
                      disabled={refreshing}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50"
                      title="Refresh account data"
                    >
                      <FaSync className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    {userData.paid && (
                      <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                        <FaCrown className="h-4 w-4" />
                        Pro License
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning Banner */}
              {warningMessage && (
                <div className={`px-8 py-4 border-b ${
                  requiresActivation 
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {requiresActivation ? (
                      <FaExclamationTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <FaInfoCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        requiresActivation 
                          ? 'text-amber-800 dark:text-amber-200' 
                          : 'text-blue-800 dark:text-blue-200'
                      }`}>
                        {warningMessage}
                      </p>
                      {requiresActivation && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Open the S3Console desktop app and activate your license with your email and license key to register this machine.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FaUser className="h-5 w-5 text-primary" />
                    User Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <FaUser className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Name
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {userData.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <FaEnvelope className="h-4 w-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Email
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {userData.email}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(userData.email, 'email')}
                        className="ml-auto p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
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
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FaKey className="h-5 w-5 text-primary" />
                    License Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <FaKey className="h-4 w-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          License Key
                        </p>
                        <p className="font-mono text-sm text-slate-900 dark:text-white break-all">
                          {userData.key}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(userData.key, 'key')}
                        className="ml-auto p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                        title="Copy license key"
                      >
                        {copiedKey ? (
                          <FaCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <FaCopy className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          userData.paid ? "bg-green-500" : "bg-amber-500"
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Status
                        </p>
                        <p
                          className={`font-medium ${
                            userData.paid ? "text-green-600" : "text-amber-600"
                          }`}
                        >
                          {userData.paid
                            ? "Pro License Active"
                            : "Trial Version"}
                        </p>
                      </div>
                    </div>
                    {userData.paid && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Licenses
                            </p>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {userData.licenseCount || 1} license(s) purchased
                            </p>
                          </div>
                        </div>
                        <CheckoutButton 
                           text="Buy More" 
                           quantity={1} 
                           className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Machine Management Section */}
              {userData.paid && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <FaDesktop className="h-5 w-5 text-primary" />
                      Registered Machines
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                        (userData.machines?.length || 0) >= (userData.licenseCount || 1)
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {userData.machines?.length || 0} / {userData.licenseCount || 1}
                      </span>
                    </div>
                  </div>
                  
                  {/* License Usage Info */}
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      You have <strong className="text-slate-900 dark:text-white">{userData.licenseCount || 1}</strong> license(s) purchased. 
                      Each license allows you to register <strong className="text-slate-900 dark:text-white">1 machine</strong>.
                      {userData.licenseCount > 1 && (
                        <span> Purchase additional licenses to register more machines.</span>
                      )}
                    </p>
                  </div>

                  {userData.machines && Array.isArray(userData.machines) && userData.machines.length > 0 ? (
                    <div className="space-y-2">
                      {userData.machines.map((machineId: string, index: number) => (
                        <div
                          key={machineId}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              <FaDesktop className={`h-4 w-4 ${
                                index === 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                Machine {index + 1}
                                {index === 0 && userData.machines.length === 1 && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Primary)</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate" title={machineId}>
                                {machineId}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeregisterMachine(machineId)}
                            disabled={deletingMachine === machineId}
                            className="ml-3 p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
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
                      
                      {/* Show if at limit */}
                      {(userData.machines.length >= (userData.licenseCount || 1)) && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            <FaExclamationTriangle className="inline h-4 w-4 mr-2" />
                            You've reached your machine limit. Deregister a machine or purchase an additional license.
                          </p>
                          <CheckoutButton 
                            text="Add License" 
                            quantity={1} 
                            className="ml-4 bg-amber-600 hover:bg-amber-700 text-white border-none"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <FaDesktop className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium mb-1">No machines registered yet</p>
                      <p className="text-sm mt-2">
                        {requiresActivation ? (
                          <>
                            Activate your license in the desktop app to register this machine.
                            <br />
                            <span className="text-xs mt-1 block">Use your email: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">{userData.email}</code> and license key shown above.</span>
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white text-center">
                  <FaCrown className="h-10 w-10 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold mb-1">
                    Unlock S3Console Pro
                  </h3>
                  <p className="text-base opacity-90">
                    One-time payment, lifetime access
                  </p>
                </div>

                <div className="p-6">
                  <CheckoutButton 
                    text="Purchase S3Console - $49" 
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
