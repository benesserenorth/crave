CREATE TABLE IF NOT EXISTS "pending_user" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code" uuid NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_user_code_index" ON "pending_user" ("code");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_user" ADD CONSTRAINT "pending_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
