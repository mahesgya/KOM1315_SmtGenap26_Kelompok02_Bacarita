import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, speakingRate } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_TTS_API_KEY" },
        { status: 500 }
      );
    }

    const body = {
      input: { text },
      voice: {
        languageCode: "id-ID",
        name: "id-ID-Wavenet-C",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: speakingRate,
      },
    };

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Google TTS error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ audioContent: data.audioContent });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
