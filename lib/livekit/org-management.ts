/**
 * Organization LiveKit Management
 * Functions to manage and update LiveKit settings for organizations
 */

import { db, orgs } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Get organization with LiveKit credentials
 * @param orgId - Organization ID
 */
export async function getOrgWithLiveKit(orgId: string) {
  return await db.query.orgs.findFirst({
    where: eq(orgs.id, orgId),
  });
}

/**
 * Check if organization has LiveKit configured
 * @param orgId - Organization ID
 * @returns true if all required LiveKit fields are present
 */
export async function isOrgLiveKitConfigured(orgId: string): Promise<boolean> {
  const org = await getOrgWithLiveKit(orgId);
  
  return !!(
    org &&
    org.livekitApiKey &&
    org.livekitApiSecret &&
    org.livekitProjectId &&
    org.livekitUrl
  );
}

/**
 * Get all organizations without LiveKit configured
 * Useful for migration/setup purposes
 */
export async function getUnConfiguredOrgs() {
  return await db.query.orgs.findMany();
  // Note: Filter in JS since we can't do a good NOT NULL check with Drizzle in complex cases
  // const all = await db.query.orgs.findMany();
  // return all.filter(
  //   (org) =>
  //     !org.livekitApiKey ||
  //     !org.livekitApiSecret ||
  //    !org.livekitProjectId
  // );
}

/**
 * Get organization by ID
 */
export async function getOrgById(orgId: string) {
  return await db.query.orgs.findFirst({
    where: eq(orgs.id, orgId),
  });
}

/**
 * Get organization by slug
 */
export async function getOrgBySlug(slug: string) {
  return await db.query.orgs.findFirst({
    where: eq(orgs.slug, slug),
  });
}
