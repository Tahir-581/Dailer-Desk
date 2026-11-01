DO $$ BEGIN
 ALTER TABLE "orgs" ADD COLUMN "livekit_api_key" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "orgs" ADD COLUMN "livekit_api_secret" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "orgs" ADD COLUMN "livekit_project_id" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "orgs" ADD COLUMN "livekit_url" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
