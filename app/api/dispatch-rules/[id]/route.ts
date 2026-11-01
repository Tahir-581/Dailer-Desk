import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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
      throw new Error(`Failed to get dispatch rule: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const rule = data.items?.find((item: any) => item.sip_dispatch_rule_id === params.id);

    if (!rule) {
      return new NextResponse('Dispatch rule not found', { status: 404 });
    }

    return NextResponse.json(rule, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    */
  } catch (error) {
    console.error('Error getting dispatch rule:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const apiUrl = `${httpUrl}/twirp/livekit.SIP/UpdateSIPDispatchRule`;

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
      body: JSON.stringify({
        sip_dispatch_rule_id: params.id,
        ...body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiveKit API error:', response.status, errorText);
      throw new Error(`Failed to update dispatch rule: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    */
  } catch (error) {
    console.error('Error updating dispatch rule:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const apiUrl = `${httpUrl}/twirp/livekit.SIP/DeleteSIPDispatchRule`;

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
      body: JSON.stringify({
        sip_dispatch_rule_id: params.id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiveKit API error:', response.status, errorText);
      throw new Error(`Failed to delete dispatch rule: ${response.status} ${errorText}`);
    }

    return new NextResponse(null, { status: 204 });
    */
  } catch (error) {
    console.error('Error deleting dispatch rule:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
