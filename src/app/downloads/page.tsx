"use client";
import Header from "@/components/sections/header";
import Section from "@/components/section";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import {
  FaWindows,
  FaApple,
  FaDownload,
  FaCrown,
  FaKey,
  FaUser,
  FaEnvelope,
  FaCheck,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { useState, useEffect, useRef } from "react";
import { DodoPayments } from "dodopayments-checkout";
import confetti from "canvas-confetti";

// Declare global twq function for Twitter pixel
declare global {
  interface Window {
    twq: (action: string, eventId: string, params?: any) => void;
  }
}

const client = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export default function DownloadsPage() {
  const { userId } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [dodoInitialized, setDodoInitialized] = useState(false);

  // Create a ref to store the latest userData
  const userDataRef = useRef(userData);

  // Update the ref whenever userData changes
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // Initialize Dodo Payments once when component mounts
  useEffect(() => {
    console.log("Initialization effect running...");
    console.log("typeof window:", typeof window);
    console.log("DodoPayments:", DodoPayments);
    console.log("dodoInitialized:", dodoInitialized);

    if (typeof window !== "undefined" && DodoPayments && !dodoInitialized) {
      try {
        console.log("Attempting to initialize DodoPayments...");
        DodoPayments.Initialize({
          mode: "live", // Using live mode
          onEvent: async (event) => {
            console.log("🔔 DODO EVENT RECEIVED:", event);
            console.log("🔔 Event type:", event.event_type);
            console.log("🔔 Event data:", event.data);

            // Get the latest userData from ref
            const currentUserData = userDataRef.current;
            console.log("🔔 Current userData from ref:", currentUserData);

            // Use correct event types from documentation
            if (event.event_type === "checkout.redirect") {
              console.log(
                "✅ CHECKOUT.REDIRECT EVENT - Purchase successful!",
                event
              );

              // Track purchase event with Twitter pixel
              if (
                typeof window !== "undefined" &&
                window.twq &&
                currentUserData
              ) {
                console.log("📊 Tracking purchase with Twitter pixel");
                window.twq("event", "tw-pyshe-pyshf", {
                  email_address: currentUserData.email || null,
                  conversion_type: "purchase",
                  value: "29.99",
                  currency: "USD",
                });
              }

              // Process payment success - triggers DynamoDB update, email, and confetti
              console.log("🚀 CALLING processPaymentSuccess...");
              console.log("🚀 Current userData available:", !!currentUserData);
              try {
                if (currentUserData) {
                  await processPaymentSuccess(currentUserData);
                  console.log(
                    "✅ processPaymentSuccess completed successfully"
                  );
                } else {
                  console.error(
                    "❌ No userData available, triggering URL-based processing"
                  );
                  // Set a flag to trigger URL-based processing
                  window.location.href =
                    window.location.origin + "/downloads?success=true";
                }
              } catch (error) {
                console.error("❌ processPaymentSuccess failed:", error);
              }
            } else if (event.event_type === "checkout.opened") {
              console.log("📂 Checkout overlay opened");
            } else if (event.event_type === "checkout.closed") {
              console.log("❌ Checkout has been closed");
            } else if (event.event_type === "checkout.error") {
              console.error("💥 Checkout error:", event.data?.message || event);
            } else {
              console.log("❓ Unknown event type:", event.event_type, event);
            }
          },
          theme: "light",
          linkType: "static",
          displayType: "overlay",
        });
        setDodoInitialized(true);
        console.log("DodoPayments initialized successfully");
      } catch (error) {
        console.error("Failed to initialize DodoPayments:", error);
        console.error("Initialization error details:", {
          message: (error as any)?.message,
          stack: (error as any)?.stack,
          type: typeof error,
        });
      }
    } else {
      console.log("Skipping initialization because:", {
        windowUndefined: typeof window === "undefined",
        noDodoPayments: !DodoPayments,
        alreadyInitialized: dodoInitialized,
      });
    }
  }, []); // Initialize only once

  // Add window event listener as additional backup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("🔔 Window message received:", event);
      if (event.data && event.data.type === "dodo-payment-success") {
        console.log("✅ Payment success detected via window message");
        if (userDataRef.current) {
          processPaymentSuccess(userDataRef.current);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Check for payment success on page load (backup mechanism)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get("success");

    console.log("URL success check:", {
      isSuccess,
      userData: userData?.email,
      alreadyPaid: userData?.paid,
      processingPayment,
    });

    if (
      isSuccess === "true" &&
      userData &&
      !userData.paid &&
      !processingPayment
    ) {
      console.log("Payment success detected from URL, processing...");
      processPaymentSuccess(userData);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userData, processingPayment]);

  useEffect(() => {
    if (!userId) {
      redirect("/sign-in");
    }

    // Fetch user data from DynamoDB
    const fetchUserData = async () => {
      const command = new QueryCommand({
        TableName: "S3Console",
        IndexName: "clerkId-index",
        KeyConditionExpression: "clerkId = :clerkId",
        ExpressionAttributeValues: {
          ":clerkId": userId,
        },
      });

      const response = await docClient.send(command);
      setUserData(response.Items?.[0]);
      setLoading(false);
    };

    fetchUserData();
  }, [userId]);

  // Test DynamoDB connection
  const testDynamoConnection = async () => {
    try {
      console.log("Testing DynamoDB connection...");
      const testCommand = new QueryCommand({
        TableName: "S3Console",
        IndexName: "clerkId-index",
        KeyConditionExpression: "clerkId = :clerkId",
        ExpressionAttributeValues: {
          ":clerkId": userId,
        },
        Limit: 1,
      });

      const testResponse = await docClient.send(testCommand);
      console.log("DynamoDB connection test successful:", testResponse);
      return true;
    } catch (error) {
      console.error("DynamoDB connection test failed:", error);
      return false;
    }
  };

  const processPaymentSuccess = async (userDataToProcess?: any) => {
    // Use passed userData or fall back to state
    const currentUserData = userDataToProcess || userData;
    
    console.log("=== PROCESSING PAYMENT SUCCESS ===");
    console.log("processPaymentSuccess called with userData:", currentUserData);
    console.log("Current user state:", {
      email: currentUserData?.email,
      paid: currentUserData?.paid,
      onTrial: currentUserData?.onTrial,
      name: currentUserData?.name,
    });

    if (!currentUserData) {
      console.error("No userData available for payment processing");
      return;
    }

    try {
      setProcessingPayment(true);
      console.log("Set processingPayment to true");

      // Test DynamoDB connection first
      const connectionTest = await testDynamoConnection();
      if (!connectionTest) {
        throw new Error("DynamoDB connection failed");
      }

      // Add a small delay to ensure smooth transition
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update user's paid status in DynamoDB
      if (currentUserData && currentUserData.email) {
        console.log("Updating DynamoDB for email:", currentUserData.email);
        console.log("DynamoDB client config:", {
          region: "ap-south-1",
          hasAccessKey: !!process.env.NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY,
        });

        const updateCommand = new UpdateCommand({
          TableName: "S3Console",
          Key: { email: currentUserData.email },
          UpdateExpression: "SET paid = :paid, onTrial = :onTrial",
          ExpressionAttributeValues: {
            ":paid": true,
            ":onTrial": false,
          },
        });

        console.log("Update command details:", {
          TableName: "S3Console",
          Key: { email: currentUserData.email },
          UpdateExpression: "SET paid = :paid, onTrial = :onTrial",
          ExpressionAttributeValues: {
            ":paid": true,
            ":onTrial": false,
          },
        });

        console.log("Sending update command to DynamoDB...");
        const updateResult = await docClient.send(updateCommand);
        console.log("DynamoDB update result:", updateResult);
        console.log(
          "Update successful! Status code:",
          updateResult.$metadata?.httpStatusCode
        );
        console.log(
          "Successfully updated user payment status for:",
          currentUserData.email
        );

        // Send confirmation email only if not already paid
        if (!currentUserData.paid) {
          try {
            const emailResponse = await fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: currentUserData.email,
                name: currentUserData.name,
              }),
            });

            if (!emailResponse.ok) {
              console.warn("Failed to send email:", await emailResponse.text());
            }
          } catch (err) {
            console.warn("Email sending failed", err);
          }
        }

        // Trigger confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Additional confetti burst
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 250);

        // Refresh user data to reflect the changes
        console.log("Refreshing user data from DynamoDB...");
        const refreshCommand = new QueryCommand({
          TableName: "S3Console",
          IndexName: "clerkId-index",
          KeyConditionExpression: "clerkId = :clerkId",
          ExpressionAttributeValues: {
            ":clerkId": userId,
          },
        });

        const refreshResponse = await docClient.send(refreshCommand);
        const refreshedUserData = refreshResponse.Items?.[0];
        console.log("Refreshed user data:", refreshedUserData);
        console.log("New paid status:", refreshedUserData?.paid);
        console.log("New onTrial status:", refreshedUserData?.onTrial);

        setUserData(refreshedUserData);
        setPaymentSuccess(true);
        console.log("Payment processing completed successfully!");
      } else {
        console.error(
          "currentUserData or currentUserData.email is missing, cannot update DynamoDB"
        );
      }
    } catch (error) {
      console.error("Failed to process payment:", error);
      console.error("Error details:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        statusCode: (error as any)?.$metadata?.httpStatusCode,
        requestId: (error as any)?.$metadata?.requestId,
      });

      // Show error to user
      alert(
        "There was an issue processing your payment. Please contact support with your payment confirmation."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleMacDownload = () => {
    // Start the download
    const downloadLink =
      "https://s3consolemac.s3.us-east-1.amazonaws.com/S3Console-1.0.66-arm64.dmg";

    // Create a temporary anchor element for download
    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "S3Console-1.0.66-arm64.dmg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track download event with Twitter pixel
    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "mac_download",
      });
    }

    // Show notification
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

    // Remove notification after 8 seconds
    setTimeout(() => {
      notification.classList.add("animate-out", "slide-out-to-bottom");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 8000);
  };

  const handleWindowsDownload = () => {
    // Start the download
    const downloadLink =
      "https://s3consolewindows.s3.ap-south-1.amazonaws.com/S3Console-Setup-1.0.66.exe";

    // Create a temporary anchor element for download
    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "S3Console-Setup-1.0.66.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track download event with Twitter pixel
    if (typeof window !== "undefined" && window.twq) {
      window.twq("event", "tw-pyshe-pyshf", {
        email_address: userData?.email || null,
        conversion_type: "windows_download",
      });
    }

    // Show notification
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

    // Remove notification after 8 seconds
    setTimeout(() => {
      notification.classList.add("animate-out", "slide-out-to-bottom");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 8000);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Payment Processing Overlay */}
        {processingPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md mx-auto text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                Processing Payment...
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Please wait while we confirm your purchase
              </p>
            </div>
          </div>
        )}

        {/* Payment Success Modal */}
        {paymentSuccess && !processingPayment && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
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
          </div>

          {/* User Dashboard */}
          {userData && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-12">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <FaUser className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Your Account
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      License and download information
                    </p>
                  </div>
                  {userData.paid && (
                    <div className="ml-auto flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      <FaCrown className="h-4 w-4" />
                      Pro License
                    </div>
                  )}
                </div>
              </div>

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
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Email
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {userData.email}
                        </p>
                      </div>
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Section */}
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
                  <Button
                    onClick={() => {
                      try {
                        console.log(
                          "Button clicked - checking prerequisites..."
                        );
                        console.log("dodoInitialized:", dodoInitialized);
                        console.log("DodoPayments object:", DodoPayments);
                        console.log(
                          "DodoPayments.Checkout:",
                          DodoPayments?.Checkout
                        );
                        console.log("userData:", userData);

                        // Check if DodoPayments is initialized
                        if (!dodoInitialized) {
                          console.error("DodoPayments not initialized yet");
                          alert(
                            "Payment system is still loading. Please wait a moment and try again."
                          );
                          return;
                        }

                        // Check if DodoPayments.Checkout exists
                        if (!DodoPayments?.Checkout?.open) {
                          console.error(
                            "DodoPayments.Checkout.open is not available"
                          );
                          alert(
                            "Payment system is not properly loaded. Please refresh the page and try again."
                          );
                          return;
                        }

                        // Check if userData exists
                        if (!userData?.email) {
                          console.error("User data not available");
                          alert(
                            "User information is not loaded. Please refresh the page and try again."
                          );
                          return;
                        }

                        console.log(
                          "Opening checkout for product:",
                          "pdt_HAAaTSsGKpgkDFzHYprZM"
                        );
                        console.log("User email:", userData.email);

                        // Open checkout with your product
                        DodoPayments.Checkout.open({
                          products: [
                            {
                              productId: "pdt_HAAaTSsGKpgkDFzHYprZM",
                              quantity: 1,
                            },
                          ],
                          redirectUrl:
                            window.location.origin + "/downloads?success=true",
                          queryParams: {
                            email: userData.email,
                            disableEmail: "true",
                          },
                        });

                        console.log("Checkout.open called successfully");
                      } catch (error) {
                        console.error("Failed to open checkout:", error);
                        console.error("Error details:", {
                          message: (error as any)?.message,
                          stack: (error as any)?.stack,
                          type: typeof error,
                          name: (error as any)?.name,
                        });

                        // Show user-friendly error message
                        alert(
                          "Failed to open checkout. Please try again or contact support. Error: " +
                            ((error as any)?.message || "Unknown error")
                        );
                      }
                    }}
                    disabled={!dodoInitialized}
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaCrown className="mr-2 h-5 w-5" />
                    {!dodoInitialized
                      ? "Loading payment system..."
                      : "Purchase S3Console - $29.99"}
                  </Button>

                  {/* Debug button - remove in production */}
                  {process.env.NODE_ENV === "development" && userData && (
                    <Button
                      onClick={() => {
                        console.log(
                          "🧪 Manual test: Calling processPaymentSuccess"
                        );
                        processPaymentSuccess(userData);
                      }}
                      className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
                    >
                      🧪 Test Payment Processing (Dev Only)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
