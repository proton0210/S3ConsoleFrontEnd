import Section from "@/components/section";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FaWindows, FaApple } from "react-icons/fa";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIAQLSIVCVNSTPJN46F",
    secretAccessKey: "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",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export default async function DownloadsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user data from DynamoDB
  const command = new QueryCommand({
    TableName: "S3Console",
    IndexName: "clerkId-index",
    KeyConditionExpression: "clerkId = :clerkId",
    ExpressionAttributeValues: {
      ":clerkId": userId,
    },
  });

  const response = await docClient.send(command);
  const userData = response.Items?.[0];

  return (
    <Section title="Download S3Console" className="py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center border rounded-lg p-6 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
          <FaWindows className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold">Download for Windows</h3>
        </div>
        <div className="flex flex-col items-center border rounded-lg p-6 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
          <FaApple className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold">Download for macOS</h3>
        </div>
      </div>

      {userData && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">User Information</h3>
            <p className="text-gray-600">Name: {userData.name}</p>
            <p className="text-gray-600">Email: {userData.email}</p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">License Information</h3>
            <p className="text-gray-600">License Key: {userData.key}</p>
            <p className="text-gray-600">
              Status: {userData.paid ? "Paid" : "Trial"}
            </p>
          </div>
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <Button size="lg">Buy LifeTime Access now</Button>
      </div>
    </Section>
  );
}
