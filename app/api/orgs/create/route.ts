import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, orgs, orgMemberships } from "@/lib/db";
import { generateSlug } from "@/lib/auth/utils";
import { createLiveKitProject } from "@/lib/livekit/project-service";
import { eq } from "drizzle-orm";

function isValidLiveKitUrl(url: string): boolean {
  return url.startsWith("wss://") || url.startsWith("ws://");
}

type LiveKitCreds = {
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  livekitProjectId?: string;
};

async function resolveLiveKitCredentials(
  body: {
    livekitUrl?: string;
    livekitApiKey?: string;
    livekitApiSecret?: string;
    livekitProjectId?: string;
  },
  orgId: string
): Promise<LiveKitCreds> {
  const fromBody: LiveKitCreds = {
    livekitUrl: (body.livekitUrl ?? "").trim(),
    livekitApiKey: (body.livekitApiKey ?? "").trim(),
    livekitApiSecret: (body.livekitApiSecret ?? "").trim(),
    livekitProjectId: (body.livekitProjectId ?? "").trim() || undefined,
  };

  if (fromBody.livekitUrl && fromBody.livekitApiKey && fromBody.livekitApiSecret) {
    if (!isValidLiveKitUrl(fromBody.livekitUrl)) {
      throw new Error("LiveKit URL must start with wss:// or ws://");
    }
    return fromBody;
  }

  const envUrl = (process.env.LIVEKIT_URL ?? "").trim();
  const envKey = (process.env.LIVEKIT_API_KEY ?? "").trim();
  const envSecret = (process.env.LIVEKIT_API_SECRET ?? "").trim();
  const envProjectId = (process.env.LIVEKIT_PROJECT_ID ?? "").trim() || undefined;

  if (envUrl && envKey && envSecret) {
    if (!isValidLiveKitUrl(envUrl)) {
      throw new Error("LIVEKIT_URL must start with wss:// or ws://");
    }
    return {
      livekitUrl: envUrl,
      livekitApiKey: envKey,
      livekitApiSecret: envSecret,
      livekitProjectId: envProjectId,
    };
  }

  if (process.env.LIVEKIT_CLOUD_API_KEY && process.env.LIVEKIT_CLOUD_API_SECRET) {
    const project = await createLiveKitProject(`org-${orgId}`);
    return {
      livekitUrl: project.url,
      livekitApiKey: project.api_key,
      livekitApiSecret: project.api_secret,
      livekitProjectId: project.id,
    };
  }

  throw new Error(
    "LiveKit is not configured. Provide LiveKit URL/API key/secret, set LIVEKIT_URL + LIVEKIT_API_KEY + LIVEKIT_API_SECRET in .env.local, or set LIVEKIT_CLOUD_API_KEY and LIVEKIT_CLOUD_API_SECRET."
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    const slug = generateSlug(name);

    const existingOrg = await db
      .select()
      .from(orgs)
      .where(eq(orgs.slug, slug))
      .limit(1);

    if (existingOrg.length > 0) {
      return NextResponse.json(
        { error: "Organization with this name already exists" },
        { status: 409 }
      );
    }

    const orgId = randomUUID();
    let livekit: LiveKitCreds;
    try {
      livekit = await resolveLiveKitCredentials(body, orgId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to resolve LiveKit credentials";
      return NextResponse.json(
        { error: "Failed to set up LiveKit for organization", details: message },
        { status: 400 }
      );
    }

    const [newOrg] = await db
      .insert(orgs)
      .values({
        id: orgId,
        name,
        slug,
        livekitUrl: livekit.livekitUrl,
        livekitApiKey: livekit.livekitApiKey,
        livekitApiSecret: livekit.livekitApiSecret,
        livekitProjectId: livekit.livekitProjectId,
      })
      .returning();

    await db.insert(orgMemberships).values({
      userId: session.user.id,
      orgId: newOrg.id,
      role: "owner",
    });

    return NextResponse.json(newOrg, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating org:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
