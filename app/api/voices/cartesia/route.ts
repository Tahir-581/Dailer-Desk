import { NextResponse } from 'next/server';

// const CARTESIA_API_URL = 'https://api.cartesia.ai/voices';
// const CARTESIA_VERSION = '2025-04-16';

// export type CartesiaVoice = {
//   id: string;
//   name: string;
//   description?: string;
//   language?: string;
// };

export async function GET() {
  return NextResponse.json(
    { error: 'Cartesia voice fetching is disabled' },
    { status: 503 }
  );

  // const apiKey = process.env.CARTESIA_API_KEY;
  // if (!apiKey) {
  //   return NextResponse.json(
  //     { error: 'CARTESIA_API_KEY is not configured' },
  //     { status: 503 }
  //   );
  // }

  // const allVoices: CartesiaVoice[] = [];
  // let startingAfter: string | null = null;

  // try {
  //   do {
  //     const url = new URL(CARTESIA_API_URL);
  //     url.searchParams.set('limit', '100');
  //     if (startingAfter) {
  //       url.searchParams.set('starting_after', startingAfter);
  //     }

  //     const res = await fetch(url.toString(), {
  //       method: 'GET',
  //       headers: {
  //         Authorization: `Bearer ${apiKey}`,
  //         'Cartesia-Version': CARTESIA_VERSION,
  //       },
  //     });

  //     if (!res.ok) {
  //       const text = await res.text();
  //       console.error('Cartesia voices API error:', res.status, text);
  //       return NextResponse.json(
  //         { error: 'Failed to fetch Cartesia voices', details: text },
  //         { status: res.status >= 500 ? 502 : res.status }
  //       );
  //     }

  //     const data = (await res.json()) as {
  //       data: Array<{ id: string; name: string; description?: string; language?: string }>;
  //       has_more: boolean;
  //     };

  //     for (const v of data.data) {
  //       allVoices.push({
  //         id: v.id,
  //         name: v.name || v.id,
  //         description: v.description,
  //         language: v.language,
  //       });
  //     }

  //     if (data.data.length > 0 && data.has_more) {
  //       startingAfter = data.data[data.data.length - 1].id;
  //     } else {
  //       startingAfter = null;
  //     }
  //   } while (startingAfter);

  //   return NextResponse.json({ voices: allVoices });
  // } catch (err) {
  //   console.error('Cartesia voices fetch error:', err);
  //   return NextResponse.json(
  //     { error: 'Failed to fetch Cartesia voices' },
  //     { status: 502 }
  //   );
  // }
}
