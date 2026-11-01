import { NextResponse } from 'next/server';

// ========== ELEVENLABS VOICE FETCHING - COMMENTED OUT ==========
// const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/voices';

// export type ElevenLabsVoice = {
//   voice_id: string;
//   name: string;
// };

export async function GET() {
  return NextResponse.json(
    { error: 'ElevenLabs voice fetching is disabled' },
    { status: 503 }
  );

  // const apiKey = process.env.ELEVENLABS_API_KEY;
  // if (!apiKey) {
  //   return NextResponse.json(
  //     { error: 'ELEVENLABS_API_KEY is not configured' },
  //     { status: 503 }
  //   );
  // }

  // try {
  //   const res = await fetch(ELEVENLABS_API_URL, {
  //     method: 'GET',
  //     headers: {
  //       'xi-api-key': apiKey,
  //       'Content-Type': 'application/json',
  //     },
  //   });

  //   if (!res.ok) {
  //     const text = await res.text();
  //     console.error('ElevenLabs voices API error:', res.status, text);
  //     return NextResponse.json(
  //       { error: 'Failed to fetch ElevenLabs voices', details: text },
  //       { status: res.status >= 500 ? 502 : res.status }
  //     );
  //   }

  //   const data = (await res.json()) as { voices: Array<{ voice_id: string; name: string }> };
  //   const voices: ElevenLabsVoice[] = (data.voices || []).map((v) => ({
  //     voice_id: v.voice_id,
  //     name: v.name || v.voice_id,
  //   }));

  //   return NextResponse.json({ voices });
  // } catch (err) {
  //   console.error('ElevenLabs voices fetch error:', err);
  //   return NextResponse.json(
  //     { error: 'Failed to fetch ElevenLabs voices' },
  //     { status: 502 }
  //   );
  // }
}
