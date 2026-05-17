"use client";

import { useCallback, useRef, useState } from "react";

export function useGoogleTts() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getAudioBase64 = useCallback(async (text: string, speakingRate = 1) => {
    const key = text.trim();
    if (!key) return null;

    const cacheKey = `${key}__rate_${speakingRate}`;

    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)!;
    }

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: key, speakingRate }),
    });

    const data = await res.json();

    if (!res.ok || !data.audioContent) {
      console.error("TTS error", data);
      return null;
    }

    cacheRef.current.set(cacheKey, data.audioContent);
    return data.audioContent as string;
  }, []);

  const speak = useCallback(
    async (text: string, speakingRate? : number): Promise<void> => {
      const key = text.trim();
      if (!key) return;

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }

      setIsLoading(true);
      setIsPlaying(false);

      try {
        const base64 = await getAudioBase64(key, speakingRate);
        if (!base64) return;

        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Audio error"));
          };

          audio
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              reject(err);
            });
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    },
    [getAudioBase64]
  );

  const preload = useCallback(
    async (texts: string[]) => {
      const uniqueTexts = Array.from(new Set(texts.map((t) => t.trim()).filter(Boolean)));
      await Promise.all(uniqueTexts.map((t) => getAudioBase64(t).catch((e) => console.error("preload error", e))));
    },
    [getAudioBase64]
  );

  return { speak, preload, isPlaying, isLoading };
}
