"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import confetti from "canvas-confetti";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { FaCheck, FaCrown } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import Section from "@/components/section";
import { usePostHog } from "posthog-js/react";

const client = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export default function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const posthog = usePostHog();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(true);

  useEffect(() => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        let attempts = 0;
        const maxAttempts = 30; // Poll for 5 minutes

        const poll = async () => {
          try {
            console.log(
              `Checking payment status (attempt ${attempts + 1}/${maxAttempts})`
            );

            // Check user payment status
            const queryCommand = new QueryCommand({
              TableName: "S3Console",
              IndexName: "clerkId-index",
              KeyConditionExpression: "clerkId = :clerkId",
              ExpressionAttributeValues: {
                ":clerkId": userId,
              },
            });

            const queryResponse = await docClient.send(queryCommand);
            const user = queryResponse.Items?.[0];

            if (user?.paid) {
              console.log("✅ Payment confirmed by webhook!");

              posthog.capture('purchase_success', {
                amount: 49,
                currency: 'USD',
                license_key: user.key,
                userId: userId
              });

              // Trigger confetti animation
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });

              // Additional confetti burst after a short delay
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

              setUserData(user);
              setProcessingPayment(false);
              setLoading(false);
              return;
            }

            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(poll, 10000); // Poll every 10 seconds
            } else {
              console.warn("Payment confirmation timeout");
              setProcessingPayment(false);
              setLoading(false);
              alert(
                "Payment processing is taking longer than expected. Please check your email or contact support."
              );
            }
          } catch (error) {
            console.error("Error checking payment status:", error);
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(poll, 10000);
            } else {
              setProcessingPayment(false);
              setLoading(false);
            }
          }
        };

        poll();
      } catch (error) {
        console.error("Failed to check payment status:", error);
        setProcessingPayment(false);
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [userId, router]);

  if (loading || processingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-8"></div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Processing your payment...
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait while we confirm your purchase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
      <Section className="text-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full mb-6">
            <FaCheck className="h-10 w-10 text-green-600 dark:text-green-300" />
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Payment Successful!
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Thank you for purchasing S3Console Pro. Your account has been
            upgraded.
          </p>

          {userData && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <FaCrown className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold text-slate-900 dark:text-white">
                  Pro License Active
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                License Key: <span className="font-mono">{userData.key}</span>
              </p>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
              <strong>Important:</strong> To activate your Pro license:
            </p>
            <ol className="text-sm text-amber-800 dark:text-amber-200 list-decimal list-inside space-y-1 ml-2">
              <li>Open the S3Console desktop application</li>
              <li>Enter your email and license key (shown above)</li>
              <li>Your machine will be automatically registered</li>
            </ol>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
              Each seat lets you register 1 machine. Need it on more machines? Purchase an extra seat for $49 — you'll use your <strong>same license key</strong> to activate it, no new key needed.
            </p>
          </div>

          <Button
            onClick={() => router.push("/downloads")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Back to Downloads
          </Button>
        </div>
      </Section>
    </div>
  );
}
