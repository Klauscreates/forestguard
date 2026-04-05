import { createHash, createHmac } from "node:crypto";

export const GEMINI_MODEL = "gemini-2.5-flash";

const DEFAULT_BEDROCK_MODEL = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
const DEFAULT_BEDROCK_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key, value, encoding) {
  return createHmac("sha256", key).update(value, "utf8").digest(encoding);
}

function getBedrockConfig() {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: DEFAULT_BEDROCK_REGION,
    modelId: DEFAULT_BEDROCK_MODEL,
  };
}

export function isBedrockConfigured() {
  const config = getBedrockConfig();
  return Boolean(config.accessKeyId && config.secretAccessKey && config.modelId && config.region);
}

export function chooseReasoningProvider({ route }) {
  const preferredProvider = String(process.env.FOREST_REASONING_PROVIDER || "").trim().toLowerCase();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasBedrock = isBedrockConfigured();

  if (preferredProvider === "bedrock" && hasBedrock) {
    return "bedrock";
  }

  if (preferredProvider === "gemini" && hasGemini) {
    return "gemini";
  }

  if (!hasGemini && hasBedrock) {
    return "bedrock";
  }

  if (hasBedrock && ["policy_rag", "synthesis"].includes(route)) {
    return "bedrock";
  }

  return "gemini";
}

async function invokeGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini is not configured for this deployment.");
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    throw new Error(`Gemini request failed: HTTP ${geminiResponse.status}${errorText ? ` · ${errorText.slice(0, 240)}` : ""}`);
  }

  const payload = await geminiResponse.json();
  return {
    provider: "gemini",
    model: GEMINI_MODEL,
    text: payload?.candidates?.[0]?.content?.parts?.[0]?.text || "",
  };
}

function buildBedrockAuthorization({ method, path, body, host, region, accessKeyId, secretAccessKey, sessionToken }) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const signedHeaders = ["content-type", "host", "x-amz-content-sha256", "x-amz-date"];
  const headers = {
    "content-type": "application/json",
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (sessionToken) {
    headers["x-amz-security-token"] = sessionToken;
    signedHeaders.push("x-amz-security-token");
  }

  const canonicalHeaders = signedHeaders
    .slice()
    .sort()
    .map((key) => `${key}:${String(headers[key]).trim()}\n`)
    .join("");
  const sortedSignedHeaders = signedHeaders.slice().sort().join(";");
  const canonicalRequest = [method, path, "", canonicalHeaders, sortedSignedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/bedrock-runtime/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "bedrock-runtime");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${sortedSignedHeaders}, Signature=${signature}`,
  };
}

async function invokeBedrock(prompt) {
  const { accessKeyId, secretAccessKey, sessionToken, region, modelId } = getBedrockConfig();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Bedrock is not configured for this deployment.");
  }

  const host = `bedrock-runtime.${region}.amazonaws.com`;
  const path = `/model/${encodeURIComponent(modelId)}/converse`;
  const body = JSON.stringify({
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      temperature: 0.2,
      maxTokens: 1200,
      topP: 0.9,
    },
  });

  const headers = buildBedrockAuthorization({
    method: "POST",
    path,
    body,
    host,
    region,
    accessKeyId,
    secretAccessKey,
    sessionToken,
  });

  const bedrockResponse = await fetch(`https://${host}${path}`, {
    method: "POST",
    headers,
    body,
  });

  if (!bedrockResponse.ok) {
    const errorText = await bedrockResponse.text();
    throw new Error(`Bedrock request failed: HTTP ${bedrockResponse.status}${errorText ? ` · ${errorText.slice(0, 320)}` : ""}`);
  }

  const payload = await bedrockResponse.json();
  const text = payload?.output?.message?.content?.find((part) => typeof part?.text === "string")?.text || "";

  if (!text) {
    throw new Error("Bedrock returned an empty response.");
  }

  return {
    provider: "bedrock",
    model: modelId,
    text,
  };
}

export async function invokeReasoningModel({ provider, prompt }) {
  if (provider === "bedrock") {
    return invokeBedrock(prompt);
  }

  return invokeGemini(prompt);
}
