DO $$ BEGIN
 ALTER TABLE "call_sessions" ADD COLUMN "latency" integer;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
