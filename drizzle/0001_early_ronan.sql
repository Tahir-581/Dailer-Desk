DO $$ BEGIN
 CREATE TYPE "public"."call_direction" AS ENUM('inbound', 'outbound');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."call_outcome" AS ENUM('completed', 'abandoned', 'voicemail', 'busy', 'failed', 'transferred');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analysis_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"field_key" text NOT NULL,
	"type" text NOT NULL,
	"selector_options" jsonb,
	"analysis_prompt" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_definitions_org_field_key_unique" UNIQUE("org_id","field_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "call_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_session_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"summary" text,
	"action_items" text,
	"key_points" text,
	"boolean_analysis" jsonb,
	"text_analysis" jsonb,
	"number_analysis" jsonb,
	"selector_analysis" jsonb,
	"analysis_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "call_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"assistant_id" uuid,
	"phone_number_id" uuid,
	"direction" "call_direction" NOT NULL,
	"caller_number" text,
	"callee_number" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"outcome" "call_outcome",
	"recording_url" text,
	"transfer_target" text,
	"sentiment_score" numeric(3, 2),
	"transcript" text,
	"transcript_url" text,
	"recording_file_url" text,
	"recording_signed_url" text,
	"recording_signed_url_expiry" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcript_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_session_id" uuid NOT NULL,
	"speaker" text NOT NULL,
	"text" text NOT NULL,
	"start_time" numeric(10, 3) NOT NULL,
	"end_time" numeric(10, 3) NOT NULL,
	"sentiment" numeric(3, 2),
	"confidence" numeric(3, 2),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysis_definitions" ADD CONSTRAINT "analysis_definitions_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysis_definitions" ADD CONSTRAINT "analysis_definitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_analysis" ADD CONSTRAINT "call_analysis_call_session_id_call_sessions_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."call_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_analysis" ADD CONSTRAINT "call_analysis_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_assistant_id_assistants_id_fk" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_phone_number_id_phone_numbers_id_fk" FOREIGN KEY ("phone_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_call_session_id_call_sessions_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."call_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analysis_definitions_org_id_idx" ON "analysis_definitions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analysis_definitions_field_key_idx" ON "analysis_definitions" USING btree ("field_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_analysis_call_session_id_idx" ON "call_analysis" USING btree ("call_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_analysis_org_id_idx" ON "call_analysis" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_sessions_org_id_idx" ON "call_sessions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_sessions_assistant_id_idx" ON "call_sessions" USING btree ("assistant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_sessions_phone_number_id_idx" ON "call_sessions" USING btree ("phone_number_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_sessions_start_time_idx" ON "call_sessions" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_sessions_outcome_idx" ON "call_sessions" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_sessions_direction_idx" ON "call_sessions" USING btree ("direction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transcript_segments_call_session_id_idx" ON "transcript_segments" USING btree ("call_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transcript_segments_start_time_idx" ON "transcript_segments" USING btree ("start_time");
