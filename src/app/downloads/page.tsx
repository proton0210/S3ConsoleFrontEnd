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
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { useState, useEffect } from "react";
import Script from "next/script";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import confetti from "canvas-confetti";

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

  const processPaymentSuccess = async () => {
    try {
      setProcessingPayment(true);

      // Add a small delay to ensure smooth transition
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update user's paid status in DynamoDB
      if (userData) {
        const updateCommand = new UpdateItemCommand({
          TableName: "S3Console",
          Key: { email: { S: userData.email } },
          UpdateExpression: "SET paid = :paid, onTrial = :onTrial",
          ExpressionAttributeValues: {
            ":paid": { BOOL: true },
            ":onTrial": { BOOL: false },
          },
        });

        await docClient.send(updateCommand);
        console.log("Updated user payment status");

        // Send confirmation email only if not already paid
        if (!userData.paid) {
          try {
            const emailResponse = await fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: userData.email,
                name: userData.name,
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

        // Refresh user data
        const refreshCommand = new QueryCommand({
          TableName: "S3Console",
          IndexName: "clerkId-index",
          KeyConditionExpression: "clerkId = :clerkId",
          ExpressionAttributeValues: {
            ":clerkId": userId,
          },
        });

        const refreshResponse = await docClient.send(refreshCommand);
        setUserData(refreshResponse.Items?.[0]);
        setPaymentSuccess(true);
      }
    } catch (error) {
      console.error("Failed to process payment:", error);
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
      "https://s3consolemac.s3.us-east-1.amazonaws.com/S3Console-1.0.52-arm64.dmg";

    // Create a temporary anchor element for download
    const link = document.createElement("a");
    link.href = downloadLink;
    link.download = "S3Console-1.0.52-arm64.dmg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

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
            <div className="group relative overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-slate-800/50 bg-white dark:bg-slate-800">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent dark:from-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FaWindows className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-400 mb-3">
                  Windows
                </h3>
                <p className="text-slate-500 mb-6">Windows 10/11 (64-bit)</p>
                <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-medium">
                  Coming Soon
                </div>
                <Button
                  disabled
                  className="w-full bg-slate-300 hover:bg-slate-300 text-slate-500 cursor-not-allowed"
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
                    onClick={async () => {
                      try {
                        const checkout = await PolarEmbedCheckout.create(
                          "https://buy.polar.sh/polar_cl_eBEmCwlC5Mwkj7R6gk4MabewTqUqkotUewqLW2VNucV",
                          "light"
                        );

                        // Listen for when the checkout is loaded

                        // Listen for when the checkout has been closed
                        checkout.addEventListener("close", (event) => {
                          console.log("Checkout has been closed");
                        });

                        // Listen for successful completion
                        checkout.addEventListener("success", async (event) => {
                          console.log("Purchase successful!", event.detail);

                          // Process payment success - triggers DynamoDB update, email, and confetti
                          await processPaymentSuccess();
                        });

                        // Listen for errors
                        checkout.addEventListener("error", (event) => {
                          console.error("Checkout error:", event.detail);
                        });
                      } catch (error) {
                        console.error("Failed to open checkout", error);
                      }
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-md"
                  >
                    <FaCrown className="mr-2 h-5 w-5" />
                    Purchase S3Console - $49<span className="text-sm">.99</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
      <Script
        src="https://cdn.jsdelivr.net/npm/@polar-sh/web-components@0.6.0/dist/index.js"
        type="module"
      />
    </>
  );
}
