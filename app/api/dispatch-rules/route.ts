import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;

type SIPDispatchRule = {
  sip_dispatch_rule_id: string;
  name: string;
  rule: {
    dispatch_rule_individual?: {
      room_prefix?: string;
    };
    dispatch_rule_direct?: {
      room_name?: string;
    };
  };
  trunk_ids?: string[];
  inbound_numbers?: string[];
  metadata?: Record<string, any>;
};

type ListSIPDispatchRuleResponse = {
  items: SIPDispatchRule[];
};

export async function GET(req: Request) {
  try {
    // Configure routing (dispatch rules) is temporarily disabled.
    // Keeping the previous implementation below for easy restoration.
    return new NextResponse('Configure routing is temporarily disabled', { status: 410 });

    /*
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    let httpUrl = LIVEKIT_URL.replace(/\/$/, '');
    if (httpUrl.startsWith('wss://')) {
      httpUrl = httpUrl.replace('wss://', 'https://');
    } else if (httpUrl.startsWith('ws://')) {
      httpUrl = httpUrl.replace('ws://', 'http://');
    } else if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) {
      httpUrl = `https://${httpUrl}`;
    }

    const apiUrl = `${httpUrl}/twirp/livekit.SIP/ListSIPDispatchRule`;

    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: 'api-service',
      ttl: '10m',
    });

    at.addSIPGrant({
      admin: true,
    });
    const bearerToken = await at.toJwt();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiveKit API error:', response.status, errorText);
      throw new Error(`Failed to list dispatch rules: ${response.status} ${errorText}`);
    }

    const data: ListSIPDispatchRuleResponse = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    */
  } catch (error) {
    console.error('Error listing dispatch rules:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Configure routing (dispatch rules) is temporarily disabled.
    // Keeping the previous implementation below for easy restoration.
    return new NextResponse('Configure routing is temporarily disabled', { status: 410 });

    /*
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    const body = await req.json();

    let httpUrl = LIVEKIT_URL.replace(/\/$/, '');
    if (httpUrl.startsWith('wss://')) {
      httpUrl = httpUrl.replace('wss://', 'https://');
    } else if (httpUrl.startsWith('ws://')) {
      httpUrl = httpUrl.replace('ws://', 'http://');
    } else if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) {
      httpUrl = `https://${httpUrl}`;
    }

    const apiUrl = `${httpUrl}/twirp/livekit.SIP/CreateSIPDispatchRule`;

    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: 'api-service',
      ttl: '10m',
    });

    at.addSIPGrant({
      admin: true,
    });
    const bearerToken = await at.toJwt();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiveKit API error:', response.status, errorText);
      throw new Error(`Failed to create dispatch rule: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    */
  } catch (error) {
    console.error('Error creating dispatch rule:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
