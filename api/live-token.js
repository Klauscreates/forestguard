import { GoogleGenAI } from "@google/genai";
import { buildForestGuardSystemInstructions } from "./_agent-prompt.js";

const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
const LIVE_VOICE = "Kore";

function buildLiveConfig() {
  return {
    responseModalities: ["AUDIO"],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: LIVE_VOICE,
        },
      },
    },
    systemInstruction: buildForestGuardSystemInstructions({ liveSession: true }),
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return response.status(200).json({
      ok: false,
      mode: "unavailable",
      message: "Gemini is not configured for this deployment.",
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: "v1alpha",
    });

    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
        expireTime: new Date(now + 20 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: buildLiveConfig(),
        },
        lockAdditionalFields: [
          "responseModalities",
          "speechConfig",
          "systemInstruction",
        ],
      },
    });

    return response.status(200).json({
      ok: true,
      mode: "gemini-live",
      model: LIVE_MODEL,
      token: token.name,
      config: buildLiveConfig(),
    });
  } catch (error) {
    return response.status(200).json({
      ok: false,
      mode: "error",
      message: error.message,
    });
  }
}
