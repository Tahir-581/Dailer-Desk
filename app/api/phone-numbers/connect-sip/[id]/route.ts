import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { db, sipConnectedNumbers, orgMemberships } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;


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

function getLiveKitHttpUrl(): string {
  if (!LIVEKIT_URL) throw new Error('LIVEKIT_URL is not defined');
  let httpUrl = LIVEKIT_URL.replace(/\/$/, '');
  if (httpUrl.startsWith('wss://')) httpUrl = httpUrl.replace('wss://', 'https://');
  else if (httpUrl.startsWith('ws://')) httpUrl = httpUrl.replace('ws://', 'http://');
  else if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) httpUrl = `https://${httpUrl}`;
  return httpUrl;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!API_KEY || !API_SECRET) throw new Error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not defined');
  const at = new AccessToken(API_KEY, API_SECRET, { identity: 'api-service', ttl: '10m' });
  at.addSIPGrant({ admin: true });
  const token = await at.toJwt();
  return { Authorization: `Bearer ${token}` };
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Find the SIP number record
    const sipNumber = await db
      .select()
      .from(sipConnectedNumbers)
      .where(and(eq(sipConnectedNumbers.id, params.id), eq(sipConnectedNumbers.orgId, orgId)))
      .limit(1);

    if (sipNumber.length === 0) {
      return new NextResponse('SIP number not found', { status: 404 });
    }

    const record = sipNumber[0];
    const httpUrl = getLiveKitHttpUrl();
    const headers = await getAuthHeaders();

    if (record.livekitDispatchRuleId) {
      try {
        // Continue with deletion even if this fails
        await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPDispatchRule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ sip_dispatch_rule_id: record.livekitDispatchRuleId }),
        });
      } catch (err) {
        console.warn('Failed to delete dispatch rule:', err);
      }
    }

    if (record.livekitInboundTrunkId) {
      try {
        // Continue with deletion even if this fails
        await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPTrunk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ sip_trunk_id: record.livekitInboundTrunkId }),
        });
      } catch (err) {
        console.warn('Failed to delete inbound trunk:', err);
      }
    }

    if (record.livekitOutboundTrunkId) {
      try {
        // Continue with deletion even if this fails
        await fetch(`${httpUrl}/twirp/livekit.SIP/DeleteSIPTrunk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ sip_trunk_id: record.livekitOutboundTrunkId }),
        });
      } catch (err) {
        console.warn('Failed to delete outbound trunk:', err);
      }
    }

    await db
      .delete(sipConnectedNumbers)
      .where(eq(sipConnectedNumbers.id, params.id));

    return NextResponse.json({ success: true, message: 'SIP number removed successfully' });
  } catch (error) {
    console.error('Delete SIP number error:', error);
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

    // Find the SIP number record
    const sipNumber = await db
      .select()
      .from(sipConnectedNumbers)
      .where(and(eq(sipConnectedNumbers.id, params.id), eq(sipConnectedNumbers.orgId, orgId)))
      .limit(1);

    if (sipNumber.length === 0) {
      return new NextResponse('SIP number not found', { status: 404 });
    }

    const record = sipNumber[0];
    const httpUrl = getLiveKitHttpUrl();
    const headers = await getAuthHeaders();

    if (!record.livekitDispatchRuleId && record.e164) {
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
            const items = Array.isArray(listRulesData.items)
              ? listRulesData.items
              : Array.isArray(listRulesData)
                ? listRulesData
                : [];

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

              await db
                .update(sipConnectedNumbers)
                .set({
                  livekitDispatchRuleId: ruleId,
                  updatedAt: new Date(),
                })
                .where(eq(sipConnectedNumbers.id, params.id));

              return NextResponse.json({
                success: true,
                message: 'Dispatch rule ID found and updated',
                dispatch_rule_id: ruleId,
              });
            }
          } else {
            console.error('List rules response was not valid JSON or was empty');
          }
        } else {
          const errorText = await listRulesRes.text();
          console.error(`List rules request failed with status ${listRulesRes.status}: ${errorText}`);
        }
        return new NextResponse(
          'Could not find dispatch rule for this number. The rule may not exist in LiveKit. Check the logs above for details.',
          { status: 404 }
        );
      } catch (err) {
        console.error('Failed to find dispatch rule:', err);
        return new NextResponse(
          `Failed to find dispatch rule: ${err instanceof Error ? err.message : 'Unknown error'}`,
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'No action needed - dispatch rule ID already exists',
      dispatch_rule_id: record.livekitDispatchRuleId,
    });
  } catch (error) {
    console.error('Fix SIP number dispatch rule error:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
