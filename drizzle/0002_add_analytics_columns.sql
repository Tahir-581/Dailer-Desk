DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD COLUMN "transcript" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD COLUMN "transcript_url" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD COLUMN "recording_file_url" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD COLUMN "recording_signed_url" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD COLUMN "recording_signed_url_expiry" timestamp;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
