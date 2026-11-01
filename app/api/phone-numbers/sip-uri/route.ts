import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, orgMemberships } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

const LIVEKIT_URL = process.env.LIVEKIT_URL;
/** If set, this value is shown as the SIP URI (copy from LiveKit Cloud → Telephony → SIP trunk). LiveKit does not expose the project SIP URI via API. */
const LIVEKIT_SIP_URI = process.env.LIVEKIT_SIP_URI?.trim();

/**
 * Derive LiveKit SIP URI from LIVEKIT_URL when LIVEKIT_SIP_URI is not set.
 * See: https://docs.livekit.io/telephony/features/secure-trunking/#step-2-update-your-sip-uris-to-use-tls
 */
function getSipUriFromLiveKitUrl(livekitUrl: string): string | null {
  let url = livekitUrl.replace(/\/$/, '');
  if (url.startsWith('wss://')) url = url.replace('wss://', 'https://');
  else if (url.startsWith('ws://')) url = url.replace('ws://', 'http://');
  else if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!host.endsWith('.livekit.cloud')) return null;
  const sipDomain = host.replace('.livekit.cloud', '.sip.livekit.cloud');
  return `sip:${sipDomain}`;
}

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

    // Prefer SIP URI from env (copy from LiveKit Cloud → Telephony → SIP trunk); LiveKit does not expose it via API.
    if (LIVEKIT_SIP_URI) {
      const uri = LIVEKIT_SIP_URI.startsWith('sip:') ? LIVEKIT_SIP_URI : `sip:${LIVEKIT_SIP_URI}`;
      return NextResponse.json({
        sipUri: uri,
        source: 'env' as const,
      });
    }

    if (!LIVEKIT_URL) {
      return NextResponse.json(
        { error: 'LIVEKIT_SIP_URI or LIVEKIT_URL is required', sipUri: null, source: null },
        { status: 503 }
      );
    }

    const derived = getSipUriFromLiveKitUrl(LIVEKIT_URL);
    if (!derived) {
      return NextResponse.json(
        { error: 'Could not derive SIP URI from LIVEKIT_URL. Set LIVEKIT_SIP_URI from LiveKit Cloud → Telephony → SIP trunk.', sipUri: null, source: null },
        { status: 503 }
      );
    }

    return NextResponse.json({
      sipUri: derived,
      source: 'derived' as const,
    });
  } catch (e) {
    console.error('[sip-uri]', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
