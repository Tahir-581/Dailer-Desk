import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { db, phoneNumbers, sipConnectedNumbers, orgMemberships } from '@/lib/db';
import { eq, desc, type InferSelectModel } from 'drizzle-orm';
import { cookies } from 'next/headers';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const TWILIO_WEBHOOK_BASE_URL = process.env.TWILIO_WEBHOOK_BASE_URL || '';

export const revalidate = 0;

/** Extract country code (2-letter ISO) from E164 format. Returns 'US' for +1, empty string if unknown. */
function extractCountryCodeFromE164(e164: string): string {
  if (!e164.startsWith('+')) return '';
  const digits = e164.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return 'US'; // US/Canada
  if (digits.startsWith('44')) return 'GB'; // UK
  if (digits.startsWith('61')) return 'AU'; // Australia
  if (digits.startsWith('49')) return 'DE'; // Germany
  if (digits.startsWith('33')) return 'FR'; // France
  if (digits.startsWith('39')) return 'IT'; // Italy
  if (digits.startsWith('34')) return 'ES'; // Spain
  if (digits.startsWith('31')) return 'NL'; // Netherlands
  if (digits.startsWith('32')) return 'BE'; // Belgium
  if (digits.startsWith('41')) return 'CH'; // Switzerland
  if (digits.startsWith('43')) return 'AT'; // Austria
  if (digits.startsWith('46')) return 'SE'; // Sweden
  if (digits.startsWith('47')) return 'NO'; // Norway
  if (digits.startsWith('45')) return 'DK'; // Denmark
  if (digits.startsWith('358')) return 'FI'; // Finland
  if (digits.startsWith('48')) return 'PL'; // Poland
  if (digits.startsWith('353')) return 'IE'; // Ireland
  if (digits.startsWith('351')) return 'PT'; // Portugal
  return '';
}

/** Extract area code from E164 format (for US numbers). */
function extractAreaCodeFromE164(e164: string): string {
  if (!e164.startsWith('+')) return '';
  const digits = e164.replace(/\D/g, '');
  // For US numbers (+1XXXXXXXXXX), area code is digits 2-4
  if (digits.startsWith('1') && digits.length === 11) {
    return digits.slice(1, 4);
  }
  return '';
}

type PhoneNumber = {
  id: string;
  source: 'livekit' | 'sip';
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
  /** Set only for source === 'sip': Twilio voice webhook URL (when provider is twilio). */
  webhook_url?: string;
  /** Set only for source === 'sip' and provider === 'telnyx': LiveKit SIP endpoint host for Telnyx FQDN. */
  sip_endpoint?: string;
  /** SIP provider: 'twilio' | 'telnyx'. Only for source === 'sip'. */
  provider?: 'twilio' | 'telnyx';
  nickname?: string;
};

type ListPhoneNumbersResponse = {
  items: PhoneNumber[];
  total_count: number;
};

export async function GET(req: Request) {
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

    let httpUrl = LIVEKIT_URL.replace(/\/$/, '');
    if (httpUrl.startsWith('wss://')) {
      httpUrl = httpUrl.replace('wss://', 'https://');
    } else if (httpUrl.startsWith('ws://')) {
      httpUrl = httpUrl.replace('ws://', 'http://');
    } else if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) {
      httpUrl = `https://${httpUrl}`;
    }

    const apiUrl = `${httpUrl}/twirp/livekit.PhoneNumberService/ListPhoneNumbers`;
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: 'api-service',
      ttl: '10m',
    });
    at.addSIPGrant({ admin: true });
    const bearerToken = await at.toJwt();

    const fetchTimeoutMs = 15_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 100 }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LiveKit API error:', response.status, errorText);
      } else {
        const data: ListPhoneNumbersResponse = await response.json();
        for (const p of data.items) {
          await db.insert(phoneNumbers).values({
            orgId,
            livekitPhoneNumberId: p.id,
            e164Format: p.e164_format,
            countryCode: p.country_code ?? '',
            areaCode: p.area_code ?? null,
            numberType: p.number_type,
            locality: p.locality ?? null,
            region: p.region ?? null,
            capabilities: p.capabilities ?? null,
            status: p.status,
            sipDispatchRuleId: p.sip_dispatch_rule_id ?? null,
            assignedAt: p.assigned_at ? new Date(p.assigned_at) : null,
            releasedAt: p.released_at ? new Date(p.released_at) : null,
          }).onConflictDoUpdate({
            target: phoneNumbers.livekitPhoneNumberId,
            set: {
              e164Format: p.e164_format,
              countryCode: p.country_code ?? '',
              areaCode: p.area_code ?? null,
              numberType: p.number_type,
              locality: p.locality ?? null,
              region: p.region ?? null,
              capabilities: p.capabilities ?? null,
              status: p.status,
              sipDispatchRuleId: p.sip_dispatch_rule_id ?? null,
              assignedAt: p.assigned_at ? new Date(p.assigned_at) : null,
              releasedAt: p.released_at ? new Date(p.released_at) : null,
              updatedAt: new Date(),
            },
          });
        }
      }
    } catch (livekitError) {
      clearTimeout(timeoutId);
      console.warn(
        'LiveKit phone numbers fetch failed (using cached/DB data):',
        livekitError instanceof Error ? livekitError.message : livekitError
      );
    }

    const rows = await db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.orgId, orgId))
      .orderBy(desc(phoneNumbers.createdAt));

    let sipRows: Awaited<ReturnType<typeof db.select>>;
    try {
      sipRows = await db
        .select()
        .from(sipConnectedNumbers)
        .where(eq(sipConnectedNumbers.orgId, orgId))
        .orderBy(desc(sipConnectedNumbers.createdAt));
    } catch (sipError) {
      console.warn(
        'sip_connected_numbers query failed (table may be missing; run pnpm db:push or pnpm db:migrate):',
        sipError instanceof Error ? sipError.message : sipError
      );
      sipRows = [] as InferSelectModel<typeof sipConnectedNumbers>[];
    }

    const webhookUrl = TWILIO_WEBHOOK_BASE_URL
      ? `${TWILIO_WEBHOOK_BASE_URL.replace(/\/$/, '')}/twilio/sip-webhook`
      : undefined;
    const sipEndpointHost =
      LIVEKIT_URL &&
      (() => {
        try {
          const u = LIVEKIT_URL.replace(/\/$/, '').replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
          const host = new URL(u.startsWith('http') ? u : `https://${u}`).hostname;
          return host.endsWith('.livekit.cloud') ? host.replace('.livekit.cloud', '.sip.livekit.cloud') : null;
        } catch {
          return null;
        }
      })();

    const livekitItems: PhoneNumber[] = rows.map((r) => ({
      id: r.livekitPhoneNumberId,
      source: 'livekit' as const,
      e164_format: r.e164Format,
      country_code: r.countryCode,
      area_code: r.areaCode ?? '',
      number_type: r.numberType as PhoneNumber['number_type'],
      locality: r.locality ?? undefined,
      region: r.region ?? undefined,
      capabilities: r.capabilities ?? undefined,
      status: r.status as PhoneNumber['status'],
      assigned_at: r.assignedAt?.toISOString(),
      released_at: r.releasedAt?.toISOString(),
      sip_dispatch_rule_id: r.sipDispatchRuleId ?? undefined,
    }));

    const sipItems: PhoneNumber[] = sipRows.map((r) => {
      const countryCode = extractCountryCodeFromE164(r.e164);
      const areaCode = extractAreaCodeFromE164(r.e164);
      const provider = r.provider === 'telnyx' ? 'telnyx' : 'twilio';
      return {
        id: r.id,
        source: 'sip' as const,
        e164_format: r.e164,
        country_code: countryCode,
        area_code: areaCode,
        number_type: 'PHONE_NUMBER_TYPE_UNKNOWN' as const,
        status: 'PHONE_NUMBER_STATUS_ACTIVE' as const,
        webhook_url: provider === 'twilio' ? webhookUrl : undefined,
        sip_endpoint: provider === 'telnyx' ? sipEndpointHost ?? undefined : undefined,
        provider,
        nickname: r.nickname ?? undefined,
        sip_dispatch_rule_id: r.livekitDispatchRuleId ?? undefined,
      };
    });

    const items = [...livekitItems, ...sipItems].sort(
      (a, b) => (b.e164_format > a.e164_format ? 1 : -1)
    );

    return NextResponse.json(
      { items, total_count: items.length },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
