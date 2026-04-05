const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_VOICE = "Kore";

function createWavHeader(dataLength, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function pcmToWav(base64Data, mimeType = "") {
  const pcmBuffer = Buffer.from(base64Data, "base64");
  if (mimeType.includes("wav")) {
    return pcmBuffer;
  }

  const wavHeader = createWavHeader(pcmBuffer.length);
  return Buffer.concat([wavHeader, pcmBuffer]);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return response.status(200).json({
      ok: false,
      mode: "unavailable",
      message: "Gemini voice is not configured for this deployment.",
    });
  }

  const { text } = request.body || {};
  if (!text || !String(text).trim()) {
    return response.status(400).json({ error: "text is required" });
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: String(text).trim() }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: GEMINI_VOICE,
                },
              },
            },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text();
      throw new Error(`Gemini voice request failed: ${geminiResponse.status} ${detail}`);
    }

    const payload = await geminiResponse.json();
    const part = payload?.candidates?.[0]?.content?.parts?.find((entry) => entry.inlineData?.data);

    if (!part?.inlineData?.data) {
      throw new Error("Gemini voice response did not include audio data.");
    }

    const mimeType = part.inlineData.mimeType || "audio/L16;rate=24000";
    const wavBuffer = pcmToWav(part.inlineData.data, mimeType);

    response.setHeader("Content-Type", "audio/wav");
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).send(wavBuffer);
  } catch (error) {
    return response.status(200).json({
      ok: false,
      mode: "error",
      message: error.message,
    });
  }
}
