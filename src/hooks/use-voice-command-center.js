import { useCallback, useEffect, useRef, useState } from "react";

const WAKE_REGEX = /\bhey\b/i;

export function useVoiceCommandCenter({ enabled, onCommand, onStatusChange }) {
  const recognitionRef = useRef(null);
  const shouldRunRef = useRef(false);
  const awaitingCommandRef = useRef(false);
  const commandWindowRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");

  const updateStatus = useCallback((nextStatus) => {
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  }, [onStatusChange]);

  const clearCommandWindow = useCallback(() => {
    awaitingCommandRef.current = false;
    if (commandWindowRef.current) {
      window.clearTimeout(commandWindowRef.current);
      commandWindowRef.current = null;
    }
  }, []);

  const armCommandWindow = useCallback(() => {
    clearCommandWindow();
    awaitingCommandRef.current = true;
    updateStatus("wake-detected");
    commandWindowRef.current = window.setTimeout(() => {
      awaitingCommandRef.current = false;
      setTranscript("");
      updateStatus("listening");
    }, 8000);
  }, [clearCommandWindow, updateStatus]);

  const stopRecognition = useCallback(() => {
    shouldRunRef.current = false;
    clearCommandWindow();
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    recognitionRef.current?.stop?.();
    updateStatus("idle");
  }, [clearCommandWindow, updateStatus]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      updateStatus("unsupported");
      return;
    }

    setSupported(true);
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => updateStatus(awaitingCommandRef.current ? "wake-detected" : "listening");

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
        if (!finalNormalized) return;

        if (awaitingCommandRef.current) {
          clearCommandWindow();
          setTranscript(finalNormalized);
          updateStatus("processing");
          onCommand?.(finalNormalized);
          return;
        }

        if (WAKE_REGEX.test(finalNormalized)) {
          const trailingCommand = finalNormalized.replace(WAKE_REGEX, "").trim();
          if (trailingCommand) {
            setTranscript(trailingCommand);
            updateStatus("processing");
            onCommand?.(trailingCommand);
            return;
          }

          armCommandWindow();
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          shouldRunRef.current = false;
          updateStatus("blocked");
          return;
        }

        if (event.error === "no-speech") {
          updateStatus(awaitingCommandRef.current ? "wake-detected" : "listening");
          return;
        }

        updateStatus("error");
      };

      recognition.onend = () => {
        if (!shouldRunRef.current || document.visibilityState !== "visible") {
          return;
        }

        restartTimeoutRef.current = window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            updateStatus("error");
          }
        }, 400);
      };

      recognitionRef.current = recognition;
    }

    if (document.visibilityState !== "visible") {
      updateStatus("paused");
      return;
    }

    try {
      shouldRunRef.current = true;
      recognitionRef.current.start();
    } catch {
      updateStatus("listening");
    }
  }, [armCommandWindow, clearCommandWindow, onCommand, updateStatus]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(SpeechRecognition));
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopRecognition();
      return undefined;
    }

    startRecognition();

    const handleVisibility = () => {
      if (!enabled) return;
      if (document.visibilityState === "visible") {
        startRecognition();
      } else {
        recognitionRef.current?.stop?.();
        updateStatus("paused");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopRecognition();
    };
  }, [enabled, startRecognition, stopRecognition, updateStatus]);

  return {
    supported,
    status,
    transcript,
    startRecognition,
    stopRecognition,
  };
}
