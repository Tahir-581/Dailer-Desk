import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { db, sipConnectedNumbers, orgMemberships } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
/** Base URL for the Twilio webhook (e.g. https://your-webhook-server.com). No trailing slash. */
const TWILIO_WEBHOOK_BASE_URL = process.env.TWILIO_WEBHOOK_BASE_URL || '';

export const revalidate = 0;

export type SipProvider = 'twilio' | 'telnyx';

type ConnectSipBody = {
  phone_number: string;
  /** SIP provider: 'twilio' | 'telnyx'. Default 'twilio'. */
  provider?: SipProvider;
  /** Optional; only needed for outbound trunk. For inbound (calls to this number → agent), omit. */
  termination_uri?: string;
  /** SIP auth username: for Twilio set in webhook server; for Telnyx set in Telnyx FQDN connection and LiveKit trunks. */
  sip_trunk_username?: string;
  /** SIP auth password: same as above. */
  sip_trunk_password?: string;
  nickname?: string;
  transport?: 'TCP' | 'UDP' | 'TLS';
};

/** Parse JSON from a response; if body is plain text (e.g. "OK"), return null and do not throw. */
async function parseJsonOrNull(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed === '' || trimmed === 'OK' || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return null;
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeE164(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10 && value.trim().startsWith('+1')) return `+1${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 11 && !value.trim().startsWith('+')) return `+${digits}`;
  return value.trim().startsWith('+') ? value.trim() : `+${digits}`;
}

function getLiveKitHttpUrl(): string {
  if (!LIVEKIT_URL) throw new Error('LIVEKIT_URL is not defined');
  let httpUrl = LIVEKIT_URL.replace(/\/$/, '');
  if (httpUrl.startsWith('wss://')) httpUrl = httpUrl.replace('wss://', 'https://');
  else if (httpUrl.startsWith('ws://')) httpUrl = httpUrl.replace('ws://', 'http://');
  else if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) httpUrl = `https://${httpUrl}`;
  return httpUrl;
}

/** Derive LiveKit SIP endpoint hostname for Telnyx FQDN (e.g. xxx.sip.livekit.cloud). */
function getLiveKitSipEndpointHost(): string | null {
  if (!LIVEKIT_URL) return null;
  let url = LIVEKIT_URL.replace(/\/$/, '');
  if (url.startsWith('wss://')) url = url.replace('wss://', 'https://');
  else if (url.startsWith('ws://')) url = url.replace('ws://', 'http://');
  else if (!url.startsWith('http') && !url.startsWith('https://')) url = `https://${url}`;
  try {
    const host = new URL(url).hostname;
    if (host.endsWith('.livekit.cloud')) return host.replace('.livekit.cloud', '.sip.livekit.cloud');
    return null;
  } catch {
    return null;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!API_KEY || !API_SECRET) throw new Error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not defined');
  const at = new AccessToken(API_KEY, API_SECRET, { identity: 'api-service', ttl: '10m' });
  at.addSIPGrant({ admin: true });
  const token = await at.toJwt();
  return { Authorization: `Bearer ${token}` };
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get('current_org_id')?.value;
    const memberships = await db
      .select({ orgId: orgMemberships.orgId })
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, session.user.id));
    const orgId = (currentOrgId && memberships.some((m) => m.orgId === currentOrgId))
      ? currentOrgId
      : memberships[0]?.orgId;
    if (!orgId) return new NextResponse('No organization selected', { status: 400 });

    const body = (await req.json()) as ConnectSipBody;
    const rawPhone = (body.phone_number || '').trim();
    const terminationUri = (body.termination_uri || '').trim() || null;
    const provider: SipProvider = body.provider === 'telnyx' ? 'telnyx' : 'twilio';
    if (!rawPhone) {
      return new NextResponse('phone_number is required', { status: 400 });
    }

    const e164 = normalizeE164(rawPhone);
    const transport = body.transport === 'UDP' ? 'UDP' : body.transport === 'TLS' ? 'TLS' : 'TCP';
    const httpUrl = getLiveKitHttpUrl();
    const headers = await getAuthHeaders();

    const existingDbEntry = await db
      .select()
      .from(sipConnectedNumbers)
      .where(and(eq(sipConnectedNumbers.orgId, orgId), eq(sipConnectedNumbers.e164, e164)))
      .limit(1);

    if (existingDbEntry.length > 0) {
      const existing = existingDbEntry[0];
      if (existing.livekitDispatchRuleId) {
        try {
          await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPDispatchRule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ sip_dispatch_rule_id: existing.livekitDispatchRuleId }),
          });
        } catch (err) {
          console.warn('Failed to delete existing dispatch rule:', err);
        }
      }
      if (existing.livekitInboundTrunkId) {
        try {
          await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPTrunk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ sip_trunk_id: existing.livekitInboundTrunkId }),
          });
        } catch (err) {
          console.warn('Failed to delete existing inbound trunk:', err);
        }
      }
      if (existing.livekitOutboundTrunkId) {
        try {
          await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPTrunk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ sip_trunk_id: existing.livekitOutboundTrunkId }),
          });
        } catch (err) {
          console.warn('Failed to delete existing outbound trunk:', err);
        }
      }
    }

    try {
      const listTrunksUrl = `${httpUrl}/twirp/livekit.SIP/ListSIPInboundTrunk`;
      const listTrunksRes = await fetch(listTrunksUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({}),
      });
      if (listTrunksRes.ok) {
        const listTrunksData = await parseJsonOrNull(listTrunksRes);
        if (listTrunksData && Array.isArray(listTrunksData.items)) {
          // Find trunks that use this number
          for (const trunk of listTrunksData.items as Array<{ sip_trunk_id?: string; numbers?: string[] }>) {
            if (trunk.numbers && trunk.numbers.includes(e164) && trunk.sip_trunk_id) {
              try {
                // Delete this conflicting trunk
                await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPTrunk`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...headers },
                  body: JSON.stringify({ sip_trunk_id: trunk.sip_trunk_id }),
                });
                await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPTrunk`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...headers },
                  body: JSON.stringify({ sip_trunk_id: trunk.sip_trunk_id }),
                });
              } catch (err) {
                console.warn(`Failed to delete conflicting trunk ${trunk.sip_trunk_id}:`, err);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to list existing trunks (continuing anyway):', err);
    }

    const trunkName = `sip-inbound-${e164.replace(/\D/g, '').slice(-10)}`;
    const createTrunkUrl = `${httpUrl}/twirp/livekit.SIP/CreateSIPInboundTrunk`;
    const trunkBody = {
      trunk: {
        name: trunkName,
        numbers: [e164],
        authUsername: body.sip_trunk_username || '',
        authPassword: body.sip_trunk_password || '',
        allowedAddresses: [],
      },
    };
    const trunkRes = await fetch(createTrunkUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(trunkBody),
    });
    if (!trunkRes.ok) {
      const errText = await trunkRes.text();
      console.error('LiveKit CreateSIPInboundTrunk error:', trunkRes.status, errText);
      return new NextResponse(
        `Failed to create SIP inbound trunk: ${errText || trunkRes.statusText}`,
        { status: 502 }
      );
    }
    const trunkData = await parseJsonOrNull(trunkRes);
    const inboundTrunkId = trunkData
      ? (String(trunkData.sipTrunkId ?? trunkData.sip_trunk_id ?? '').trim() || null)
      : null;
    if (!inboundTrunkId) {
      return new NextResponse(
        trunkData === null
          ? "LiveKit returned a non-JSON response (e.g. plain 'OK'). The SIP API may require a different version or endpoint that returns JSON with sipTrunkId."
          : 'LiveKit did not return a trunk ID',
        { status: 502 }
      );
    }

    const ruleName = `sip-rule-${e164.replace(/\D/g, '').slice(-10)}`;
    const createRuleUrl = `${httpUrl}/twirp/livekit.SIP/CreateSIPDispatchRule`;
    const ruleBody = {
      rule: {
        dispatch_rule_individual: { room_prefix: 'call-' },
      },
      name: ruleName,
      trunk_ids: [inboundTrunkId],
      inbound_numbers: [e164],
      hide_phone_number: false,
    };
    const ruleRes = await fetch(createRuleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      body: JSON.stringify(ruleBody),
    });
    if (!ruleRes.ok) {
      const errText = await ruleRes.text();
      console.error('LiveKit CreateSIPDispatchRule error:', ruleRes.status, errText);
      try {
        await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPTrunk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ sip_trunk_id: inboundTrunkId }),
        });
      } catch (_) { }
      return new NextResponse(
        `Failed to create dispatch rule: ${errText || ruleRes.statusText}`,
        { status: 502 }
      );
    }
    const ruleResText = await ruleRes.clone().text();


    const ruleData = await parseJsonOrNull(ruleRes);
    let dispatchRuleId = ruleData
      ? (String(ruleData.sipDispatchRuleId ?? ruleData.sip_dispatch_rule_id ?? ruleData.id ?? '').trim() || null)
      : null;

    if (!dispatchRuleId) {
      console.warn(`Could not parse dispatch rule ID from response for ${e164}, attempting to find it by listing rules...`);
      // Wait a brief moment for the rule to be fully created in LiveKit
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const listRulesUrl = `${httpUrl}/twirp/livekit.SIP/ListSIPDispatchRule`;
        const listRulesRes = await fetch(listRulesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...headers
          },
          body: JSON.stringify({}),
        });
        if (listRulesRes.ok) {
          const listRulesResText = await listRulesRes.clone().text();


          const listRulesData = await parseJsonOrNull(listRulesRes);

          if (listRulesData) {
            const items = Array.isArray(listRulesData.items) ? listRulesData.items : [];

            for (const rule of items) {
              const ruleId = String(
                rule.sipDispatchRuleId ??
                rule.sip_dispatch_rule_id ??
                rule.id ??
                rule.sipDispatchRule?.sip_dispatch_rule_id ??
                ''
              ).trim();

              const ruleInboundNumbers = Array.isArray(rule.inbound_numbers)
                ? rule.inbound_numbers
                : Array.isArray(rule.inboundNumbers)
                  ? rule.inboundNumbers
                  : Array.isArray(rule.inboundNumbersList)
                    ? rule.inboundNumbersList
                    : [];

              const foundRuleName = String(rule.name ?? rule.ruleName ?? '').trim();

              const matchesByNumber = ruleId && ruleInboundNumbers.includes(e164);
              const matchesByName = ruleId && foundRuleName === ruleName;

              if (matchesByNumber || matchesByName) {
                dispatchRuleId = ruleId;
                break;
              }
            }
          } else {
            console.error('List rules response was not valid JSON or was empty');
          }
        } else {
          const errorText = await listRulesRes.text();
          console.error(`List rules request failed with status ${listRulesRes.status}: ${errorText}`);
        }

        if (!dispatchRuleId) {
          console.error(`Failed to find dispatch rule ID for ${e164} after listing rules. The rule may have been created but we cannot locate it.`);
          console.error('This will cause issues with call routing. Please check LiveKit dashboard and manually update the database if needed.');
        }
      } catch (err) {
        console.error('Failed to list dispatch rules to find the created rule:', err);
      }
    } else {
    }

    if (!dispatchRuleId) {
      console.warn(`WARNING: Dispatch rule was created for ${e164} but the ID could not be retrieved. Calls may not route to the agent properly.`);
      console.warn('Please check the LiveKit dashboard and manually update the livekit_dispatch_rule_id in the sip_connected_numbers table.');
    }

    let outboundTrunkId: string | null = null;
    if (provider === 'telnyx' && body.sip_trunk_username?.trim()) {
      const telnyxOutboundName = `sip-outbound-telnyx-${e164.replace(/\D/g, '').slice(-10)}`;
      const createOutboundUrl = `${httpUrl}/twirp/livekit.SIP/CreateSIPOutboundTrunk`;
      const outboundBody = {
        trunk: {
          name: telnyxOutboundName,
          address: 'sip.telnyx.com',
          numbers: [e164],
          authUsername: body.sip_trunk_username.trim(),
          authPassword: body.sip_trunk_password ?? '',
          transport: transport === 'UDP' ? 'SIP_TRANSPORT_UDP' : transport === 'TLS' ? 'SIP_TRANSPORT_TLS' : 'SIP_TRANSPORT_TCP',
          headersToAttributes: {
            'X-Telnyx-Username': body.sip_trunk_username.trim(),
          },
        },
      };
      try {
        const outboundRes = await fetch(createOutboundUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(outboundBody),
        });
        if (outboundRes.ok) {
          const outboundData = await parseJsonOrNull(outboundRes);
          outboundTrunkId = outboundData

            ? (String(outboundData.sipTrunkId ?? outboundData.sip_trunk_id ?? '').trim() || null)
            : null;
        } else {
          const errText = await outboundRes.text();
          console.warn('Telnyx outbound trunk creation failed (inbound still works):', outboundRes.status, errText);
        }
      } catch (err) {
        console.warn('Telnyx outbound trunk creation error:', err);
      }
    }

    await db.insert(sipConnectedNumbers).values({
      orgId,
      e164,
      nickname: body.nickname?.trim() || null,
      terminationUri,
      sipTrunkUsername: body.sip_trunk_username?.trim() || null,
      sipTrunkPassword: body.sip_trunk_password ? body.sip_trunk_password : null,
      transport,
      livekitDispatchRuleId: dispatchRuleId || null,
      livekitInboundTrunkId: inboundTrunkId,
      livekitOutboundTrunkId: outboundTrunkId,
      provider,
    }).onConflictDoUpdate({
      target: [sipConnectedNumbers.orgId, sipConnectedNumbers.e164],
      set: {
        nickname: body.nickname?.trim() || null,
        terminationUri,
        sipTrunkUsername: body.sip_trunk_username?.trim() || null,
        sipTrunkPassword: body.sip_trunk_password ? body.sip_trunk_password : null,
        transport,
        livekitDispatchRuleId: dispatchRuleId || null,
        livekitInboundTrunkId: inboundTrunkId,
        livekitOutboundTrunkId: outboundTrunkId,
        provider,
        updatedAt: new Date(),
      },
    });

    const webhookUrl =
      provider === 'twilio' && TWILIO_WEBHOOK_BASE_URL
        ? `${TWILIO_WEBHOOK_BASE_URL.replace(/\/$/, '')}/twilio/sip-webhook`
        : '';
    const sipEndpoint = provider === 'telnyx' ? getLiveKitSipEndpointHost() : null;

    return NextResponse.json({
      success: true,
      e164,
      provider,
      webhook_url: provider === 'twilio' ? (webhookUrl || undefined) : undefined,
      sip_endpoint: sipEndpoint ?? undefined,
    });
  } catch (error) {
    console.error('Connect SIP error:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
