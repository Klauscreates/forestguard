import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleGenAI } from "@google/genai/web";

const CONNECT_TIMEOUT_MS = 10000;
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000;
const RECOGNITION_RESUME_DELAY_MS = 1200;

function buildLiveConnectConfig(baseConfig = {}) {
  return {
    ...baseConfig,
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    proactivity: {
      proactiveAudio: true,
    },
  };
}

function buildContextUpdate(selectedAlert, dashboardSnapshot) {
  return [
    "FORESTGUARD CONTEXT UPDATE",
    "Treat this payload as the current authoritative dashboard state for future voice requests.",
    "Do not answer this update. Only use it to ground later responses.",
    JSON.stringify(
      {
        selectedAlert,
        dashboardSnapshot,
      },
      null,
      2
    ),
  ].join("\n\n");
}

function base64ToArrayBuffer(base64Data) {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function parseSampleRate(mimeType = "") {
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? Number(match[1]) : 24000;
}

function playPcmChunk({ audioContext, playheadRef, base64Data, mimeType }) {
  if (!base64Data || !audioContext) return;

  const sampleRate = parseSampleRate(mimeType);
  const pcmBuffer = base64ToArrayBuffer(base64Data);
  const view = new DataView(pcmBuffer);
  const samples = new Float32Array(view.byteLength / 2);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = view.getInt16(index * 2, true);
    samples[index] = sample / 32768;
  }

  const buffer = audioContext.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);

  const startAt = Math.max(playheadRef.current, audioContext.currentTime + 0.02);
  source.start(startAt);
  playheadRef.current = startAt + buffer.duration;
}

function extractResponseParts(message) {
  const parts = message?.serverContent?.modelTurn?.parts || [];
  const textParts = [];
  const audioParts = [];

  parts.forEach((part) => {
    if (part?.text) {
      textParts.push(part.text);
    }

    if (part?.inlineData?.data) {
      audioParts.push({
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
      });
    }
  });

  return {
    text: textParts.join("").trim(),
    audioParts,
  };
}

function isRateLimitError(message = "") {
  const normalized = String(message).toLowerCase();
  return normalized.includes("429") || normalized.includes("rate_limit_exceeded") || normalized.includes("quota exceeded");
}

export function useLiveVoiceAgent({
  enabled,
  selectedAlert,
  dashboardSnapshot,
  onStatusChange,
  onUserUtterance,
  onAgentResponse,
  onLog,
}) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [debug, setDebug] = useState({
    tokenStatus: "idle",
    socketState: "idle",
    socketCloseCode: null,
    socketCloseReason: "",
    lastError: "",
    audioMimeType: "",
    audioSampleRate: null,
    model: "",
    cooldownUntil: null,
  });

  const sessionRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const playheadRef = useRef(0);
  const shouldRunRef = useRef(false);
  const lastContextHashRef = useRef("");
  const activeResponseTextRef = useRef("");
  const lastUserCommandRef = useRef("");
  const recognitionEnabledRef = useRef(false);
  const statusCallbackRef = useRef(onStatusChange);
  const userUtteranceCallbackRef = useRef(onUserUtterance);
  const agentResponseCallbackRef = useRef(onAgentResponse);
  const logCallbackRef = useRef(onLog);
  const cooldownUntilRef = useRef(null);
  const resumeRecognitionTimeoutRef = useRef(null);

  const contextPayload = useMemo(
    () =>
      selectedAlert
        ? buildContextUpdate(selectedAlert, dashboardSnapshot)
        : null,
    [dashboardSnapshot, selectedAlert]
  );

  useEffect(() => {
    const browserSupported =
      typeof window !== "undefined" &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition) &&
      Boolean(window.AudioContext || window.webkitAudioContext) &&
      true;

    setSupported(browserSupported);
  }, []);

  useEffect(() => {
    statusCallbackRef.current = onStatusChange;
    userUtteranceCallbackRef.current = onUserUtterance;
    agentResponseCallbackRef.current = onAgentResponse;
    logCallbackRef.current = onLog;
  }, [onAgentResponse, onLog, onStatusChange, onUserUtterance]);

  const updateStatus = (nextStatus) => {
    setStatus(nextStatus);
    statusCallbackRef.current?.(nextStatus);
  };

  const updateDebug = (patch) => {
    setDebug((current) => ({
      ...current,
      ...patch,
    }));
  };

  const stopCurrentAudio = () => {
    playheadRef.current = 0;
    if (audioContextRef.current?.state === "running") {
      audioContextRef.current.suspend().catch(() => {});
    }
  };

  const stopRecognition = () => {
    recognitionEnabledRef.current = false;
    if (resumeRecognitionTimeoutRef.current) {
      window.clearTimeout(resumeRecognitionTimeoutRef.current);
      resumeRecognitionTimeoutRef.current = null;
    }
    try {
      recognitionRef.current?.stop?.();
    } catch {}
  };

  const resumeRecognition = () => {
    if (!recognitionRef.current || document.visibilityState !== "visible") return;
    if (resumeRecognitionTimeoutRef.current) {
      window.clearTimeout(resumeRecognitionTimeoutRef.current);
    }
    resumeRecognitionTimeoutRef.current = window.setTimeout(() => {
      resumeRecognitionTimeoutRef.current = null;
      recognitionEnabledRef.current = true;
      try {
        recognitionRef.current?.start();
      } catch {
        // Ignore duplicate start attempts.
      }
    }, RECOGNITION_RESUME_DELAY_MS);
  };

  const teardown = async () => {
    shouldRunRef.current = false;

    stopRecognition();
    recognitionRef.current = null;

    sessionRef.current?.close?.();
    sessionRef.current = null;
    recognitionEnabledRef.current = false;

    stopCurrentAudio();
    updateStatus("idle");
  };

  useEffect(() => () => {
    teardown();
  }, []);

  useEffect(() => {
    if (!enabled || !sessionRef.current || !contextPayload) return;

    const nextHash = `${selectedAlert?.id || "none"}:${dashboardSnapshot?.generatedAt || "na"}:${dashboardSnapshot?.mode || "na"}`;
    if (lastContextHashRef.current === nextHash) return;
    lastContextHashRef.current = nextHash;

    try {
      sessionRef.current.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [{ text: contextPayload }],
          },
        ],
        turnComplete: false,
      });

      logCallbackRef.current?.({
        tool: "voice.context",
        label: "Updated live session with the current ForestGuard case context",
        detail: selectedAlert ? `${selectedAlert.title} · ${selectedAlert.zone}` : "No selected alert",
        status: "completed",
      });
    } catch (error) {
      logCallbackRef.current?.({
        tool: "voice.context",
        label: "Failed to update live session context",
        detail: error.message,
        status: "failed",
      });
    }
  }, [contextPayload, dashboardSnapshot?.generatedAt, dashboardSnapshot?.mode, enabled, selectedAlert]);

  useEffect(() => {
    if (!enabled) {
      teardown();
      return undefined;
    }

    if (!supported) {
      updateStatus("unsupported");
      updateDebug({
        tokenStatus: "unsupported",
        socketState: "unsupported",
      });
      return undefined;
    }

    let cancelled = false;

    async function start() {
      if (document.visibilityState !== "visible") {
        updateStatus("paused");
        return;
      }

      if (cooldownUntilRef.current && Date.now() < cooldownUntilRef.current) {
        updateStatus("rate-limited");
        updateDebug({
          tokenStatus: "cooldown",
          socketState: "closed",
          cooldownUntil: cooldownUntilRef.current,
          lastError: "Gemini Live quota exceeded. Wait before retrying.",
        });
        return;
      }

      updateStatus("connecting");
      updateDebug({
        tokenStatus: "requesting",
        socketState: "connecting",
        socketCloseCode: null,
        socketCloseReason: "",
        lastError: "",
      });
      shouldRunRef.current = true;

      try {
        const tokenResponse = await fetch("/api/live-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const tokenPayload = await tokenResponse.json();

        if (!tokenPayload?.ok || !tokenPayload?.token) {
          updateStatus(tokenPayload?.mode === "unavailable" ? "unavailable" : "error");
          updateDebug({
            tokenStatus: tokenPayload?.mode || "error",
            socketState: "closed",
            lastError: tokenPayload?.message || "No token was returned.",
          });
          logCallbackRef.current?.({
            tool: "voice.live",
            label: "Gemini Live token request failed",
            detail: tokenPayload?.message || "No token was returned.",
            status: "failed",
          });
          return;
        }

        updateDebug({
          tokenStatus: "ok",
          model: tokenPayload.model,
        });

        const ai = new GoogleGenAI({
          apiKey: tokenPayload.token,
          apiVersion: "v1alpha",
        });

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = audioContextRef.current || new AudioContextClass({ sampleRate: 24000 });
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }

        const session = await Promise.race([
          ai.live.connect({
            model: tokenPayload.model,
            config: buildLiveConnectConfig(tokenPayload.config),
            callbacks: {
              onopen: () => {
                updateStatus("listening");
                updateDebug({
                  socketState: "open",
                  lastError: "",
                });
                logCallbackRef.current?.({
                  tool: "voice.live",
                  label: "Connected ForestGuard live voice session",
                  detail: tokenPayload.model,
                  status: "completed",
                });
              },
              onmessage: (message) => {
              const responseParts = extractResponseParts(message);
              responseParts.audioParts.forEach((part) => {
                playPcmChunk({
                  audioContext: audioContextRef.current,
                  playheadRef,
                  base64Data: part.data,
                  mimeType: part.mimeType,
                });
              });

              const outputText = message?.serverContent?.outputTranscription?.text?.trim();
              if (outputText) {
                activeResponseTextRef.current = outputText;
              } else if (responseParts.text) {
                activeResponseTextRef.current = `${activeResponseTextRef.current} ${responseParts.text}`.trim();
              }

              if (message?.serverContent?.turnComplete) {
                const finalText = activeResponseTextRef.current.trim();
                if (finalText) {
                  agentResponseCallbackRef.current?.(finalText, lastUserCommandRef.current);
                }
                activeResponseTextRef.current = "";
                updateStatus("listening");
                resumeRecognition();
              }
              },
              onerror: (event) => {
                const errorMessage = event?.message || "Live session error";
                const rateLimited = isRateLimitError(errorMessage);
                if (rateLimited) {
                  cooldownUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
                }
                updateStatus(rateLimited ? "rate-limited" : "error");
                updateDebug({
                  tokenStatus: rateLimited ? "cooldown" : "ok",
                  socketState: "error",
                  lastError: errorMessage,
                  cooldownUntil: cooldownUntilRef.current,
                });
                logCallbackRef.current?.({
                  tool: "voice.live",
                  label: "Gemini Live session error",
                  detail: errorMessage,
                  status: "failed",
                });
              },
              onclose: (event) => {
                const closeMessage = event?.reason || `Live session closed${event?.code ? ` (${event.code})` : ""}.`;
                const rateLimited = isRateLimitError(closeMessage);
                if (rateLimited) {
                  cooldownUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
                }
                updateStatus(rateLimited ? "rate-limited" : "error");
                updateDebug({
                  socketState: "closed",
                  socketCloseCode: event?.code ?? null,
                  socketCloseReason: event?.reason || "",
                  tokenStatus: rateLimited ? "cooldown" : "ok",
                  lastError: closeMessage,
                  cooldownUntil: cooldownUntilRef.current,
                });
                logCallbackRef.current?.({
                  tool: "voice.live",
                  label: "Gemini Live session closed",
                  detail: closeMessage,
                  status: "failed",
                });
              },
            },
          }),
          new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error("Timed out while opening Gemini Live voice session.")), CONNECT_TIMEOUT_MS);
          }),
        ]);

        if (cancelled) {
          session.close();
          return;
        }

        sessionRef.current = session;

        if (contextPayload) {
          session.sendClientContent({
            turns: [
              {
                role: "user",
                parts: [{ text: contextPayload }],
              },
            ],
            turnComplete: false,
          });
          lastContextHashRef.current = `${selectedAlert?.id || "none"}:${dashboardSnapshot?.generatedAt || "na"}:${dashboardSnapshot?.mode || "na"}`;
        }
        updateStatus("listening");
        updateDebug({
          socketState: "open",
          audioMimeType: "browser-speech-recognition",
          audioSampleRate: null,
        });

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition && !recognitionRef.current) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            let finalText = "";
            let interimText = "";

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
              const result = event.results[index];
              const text = result[0]?.transcript?.trim() || "";
              if (result.isFinal) {
                finalText += ` ${text}`;
              } else {
                interimText += ` ${text}`;
              }
            }

            const combined = `${finalText} ${interimText}`.trim();
            if (combined) {
              setTranscript(combined);
            }

            const finalNormalized = finalText.trim();
            if (!finalNormalized || !sessionRef.current) return;
            const command = finalNormalized;
            if (!command) return;

            stopRecognition();
            lastUserCommandRef.current = command;
            updateStatus("processing");
            userUtteranceCallbackRef.current?.(command);

            sessionRef.current.sendClientContent({
              turns: [
                {
                  role: "user",
                  parts: [{ text: command }],
                },
              ],
              turnComplete: true,
            });
          };

          recognition.onerror = (event) => {
            const message = event?.error || "Speech recognition error";
            if (message === "not-allowed" || message === "service-not-allowed") {
              updateStatus("blocked");
            } else if (message !== "no-speech") {
              updateStatus("error");
            }
            updateDebug({
              lastError: message,
            });
          };

          recognition.onend = () => {
            if (!recognitionEnabledRef.current || cancelled || document.visibilityState !== "visible") return;
            try {
              recognition.start();
            } catch {
              // Ignore duplicate start attempts.
            }
          };

          recognitionRef.current = recognition;
        }

        if (recognitionRef.current && !recognitionEnabledRef.current) {
          recognitionEnabledRef.current = true;
          try {
            recognitionRef.current.start();
          } catch {
            // Ignore duplicate start attempts.
          }
        }

        logCallbackRef.current?.({
          tool: "voice.live",
          label: "ForestGuard voice listener started",
          detail: "Browser speech recognition is listening for spoken commands while voice mode is enabled.",
          status: "completed",
        });
      } catch (error) {
        const rateLimited = isRateLimitError(error.message);
        if (rateLimited) {
          cooldownUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        }
        updateStatus(error?.name === "NotAllowedError" ? "blocked" : rateLimited ? "rate-limited" : "error");
        updateDebug({
          tokenStatus: rateLimited ? "cooldown" : "error",
          socketState: "error",
          lastError: error.message,
          cooldownUntil: cooldownUntilRef.current,
        });
        logCallbackRef.current?.({
          tool: "voice.live",
          label: "ForestGuard live voice failed to start",
          detail: error.message,
          status: "failed",
        });
      }
    }

    start();

    const handleVisibility = () => {
      if (!enabled) return;
      if (document.visibilityState === "visible") {
        start();
      } else {
        teardown();
        updateStatus("paused");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      teardown();
    };
  }, [
    contextPayload,
    dashboardSnapshot?.generatedAt,
    dashboardSnapshot?.mode,
    enabled,
    selectedAlert,
    supported,
  ]);

  return {
    supported,
    status,
    transcript,
    debug,
  };
}
