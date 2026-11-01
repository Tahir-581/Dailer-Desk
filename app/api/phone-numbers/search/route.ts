import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';



const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;



export const revalidate = 0;

type PhoneNumber = {
  id: string;
  e164_format: string;
  country_code: string;
  area_code: string;
  number_type: 'PHONE_NUMBER_TYPE_UNKNOWN' | 'PHONE_NUMBER_TYPE_MOBILE' | 'PHONE_NUMBER_TYPE_LOCAL' | 'PHONE_NUMBER_TYPE_TOLL_FREE';
  locality?: string;
  region?: string;
  capabilities?: string[];
  status: 'PHONE_NUMBER_STATUS_UNSPECIFIED' | 'PHONE_NUMBER_STATUS_ACTIVE' | 'PHONE_NUMBER_STATUS_PENDING' | 'PHONE_NUMBER_STATUS_RELEASED';
  assigned_at?: string;
  released_at?: string;
  sip_dispatch_rule_id?: string;
};

type SearchPhoneNumbersResponse = {
  items: PhoneNumber[];
};

type SearchPhoneNumbersRequest = {
  country_code: string;
  area_code?: string;
  limit?: number;
};

export async function POST(req: Request) {
  try {
    

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

    

    const body: SearchPhoneNumbersRequest = await req.json();
    
    if (!body.country_code) {
      return new NextResponse('country_code is required', { status: 400 });
    }

    

    

    let httpUrl = LIVEKIT_URL.replace(/\/$/, '');
    if (httpUrl.startsWith('wss://')) {
      httpUrl = httpUrl.replace('wss://', 'https://');
    } else if (httpUrl.startsWith('ws://')) {
      httpUrl = httpUrl.replace('ws://', 'http://');
    } else if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) {
      

      httpUrl = `https://${httpUrl}`;
    }

    

    const apiUrl = `${httpUrl}/twirp/livekit.PhoneNumberService/SearchPhoneNumbers`;

    

    

    

    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: 'api-service', 

      ttl: '10m',
    });
    

    

    at.addSIPGrant({
      admin: true, 

    });
    const bearerToken = await at.toJwt();

    

    const requestBody: any = {
      country_code: body.country_code,
    };
    
    if (body.area_code) {
      requestBody.area_code = body.area_code;
    }
    
    if (body.limit) {
      requestBody.limit = body.limit;
    } else {
      requestBody.limit = 50; 

    }

    

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
      throw new Error(`Failed to search phone numbers: ${response.status} ${errorText}`);
    }

    const data: SearchPhoneNumbersResponse = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error searching phone numbers:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
