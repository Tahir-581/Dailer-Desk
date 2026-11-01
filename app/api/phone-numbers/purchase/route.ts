import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { db, phoneNumbers, orgMemberships } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;

type PhoneNumber = {
  id: string;
  e164_format: string;
  status: 'PHONE_NUMBER_STATUS_UNSPECIFIED' | 'PHONE_NUMBER_STATUS_ACTIVE' | 'PHONE_NUMBER_STATUS_PENDING' | 'PHONE_NUMBER_STATUS_RELEASED';
};

type PurchasePhoneNumberResponse = {
  phone_numbers: PhoneNumber[];
};

type PurchasePhoneNumberRequest = {
  phone_numbers: string[];
  // Configure routing (dispatch rules) is temporarily disabled.
  // sip_dispatch_rule_id?: string;
};

function countryCodeFromE164(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length >= 1) return digits.slice(0, Math.min(3, digits.length));
  return '1';
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get('current_org_id')?.value;
    const memberships = await db
      .select({ orgId: orgMemberships.orgId })
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, session.user.id));
    const orgId = (currentOrgId && memberships.some((m) => m.orgId === currentOrgId))
      ? currentOrgId
      : memberships[0]?.orgId;
    if (!orgId) {
      return new NextResponse('No organization selected', { status: 400 });
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

    

    const body: PurchasePhoneNumberRequest = await req.json();
    
    if (!body.phone_numbers || !Array.isArray(body.phone_numbers) || body.phone_numbers.length === 0) {
      return new NextResponse('phone_numbers array is required and must not be empty', { status: 400 });
    }

    

    

    let httpUrl = LIVEKIT_URL.replace(/\/$/, '');
    if (httpUrl.startsWith('wss://')) {
      httpUrl = httpUrl.replace('wss://', 'https://');
    } else if (httpUrl.startsWith('ws://')) {
      httpUrl = httpUrl.replace('ws://', 'http://');
    } else if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) {
      

      httpUrl = `https://${httpUrl}`;
    }

    

    const apiUrl = `${httpUrl}/twirp/livekit.PhoneNumberService/PurchasePhoneNumber`;

    

    

    

    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: 'api-service', 

      ttl: '10m',
    });
    

    

    at.addSIPGrant({
      admin: true, 

    });
    const bearerToken = await at.toJwt();

    

    const requestBody: any = {
      phone_numbers: body.phone_numbers,
    };
    
    // Configure routing (dispatch rules) is temporarily disabled.
    // if (body.sip_dispatch_rule_id) {
    //   requestBody.sip_dispatch_rule_id = body.sip_dispatch_rule_id;
    // }

    

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiveKit API error:', response.status, errorText);
      throw new Error(`Failed to purchase phone numbers: ${response.status} ${errorText}`);
    }

    const data: PurchasePhoneNumberResponse = await response.json();

    for (const p of data.phone_numbers) {
      await db.insert(phoneNumbers).values({
        orgId,
        livekitPhoneNumberId: p.id,
        e164Format: p.e164_format,
        countryCode: countryCodeFromE164(p.e164_format),
        numberType: 'PHONE_NUMBER_TYPE_UNKNOWN',
        status: p.status,
      }).onConflictDoUpdate({
        target: phoneNumbers.livekitPhoneNumberId,
        set: {
          status: p.status,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error purchasing phone numbers:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
