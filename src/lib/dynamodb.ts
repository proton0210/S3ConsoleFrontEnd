// Phase 11 — SERVER-ONLY module. Importing from a client component throws at
// build time thanks to the `server-only` marker. The Amplify SSR compute role
// provides DDB credentials via the AWS SDK's default credential chain — no
// NEXT_PUBLIC_* leaks, no env-stuffed long-lived keys.
import "server-only";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

/**
 * Build the DDB client config. When DYNAMO_ACCESS_KEY_ID + DYNAMO_SECRET_ACCESS_KEY
 * are present (Amplify Console env), pass them explicitly — the SDK's default
 * chain only recognizes AWS_*-prefixed names, not DYNAMO_*. When unset, fall
 * through to the default chain (Amplify SSR role / local AWS_PROFILE).
 */
export function getDdbClientConfig() {
  const accessKeyId = process.env.DYNAMO_ACCESS_KEY_ID;
  const secretAccessKey = process.env.DYNAMO_SECRET_ACCESS_KEY;
  return {
    region: process.env.AWS_REGION || "ap-south-1",
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  };
}

const client = new DynamoDBClient(getDdbClientConfig());

const docClient = DynamoDBDocumentClient.from(client);

export async function putItem(tableName: string, item: Record<string, any>) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  return docClient.send(command);
}

export async function getItem(tableName: string, key: Record<string, any>) {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  return docClient.send(command);
}

export async function updateItem(
  tableName: string,
  key: Record<string, any>,
  updateExpression: string,
  expressionAttributeValues: Record<string, any>
) {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  });
  return docClient.send(command);
}

export async function deleteItem(tableName: string, key: Record<string, any>) {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });
  return docClient.send(command);
}

export async function queryItems(
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, any>,
  indexName?: string
) {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ...(indexName ? { IndexName: indexName } : {}),
  });
  return docClient.send(command);
}

export async function scanItems(
  tableName: string,
  filterExpression?: string,
  expressionAttributeValues?: Record<string, any>
) {
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  });
  return docClient.send(command);
}
