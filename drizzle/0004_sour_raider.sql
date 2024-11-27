ALTER TABLE "category" DROP CONSTRAINT "category_name_unique";--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_name_unique" UNIQUE("user_id","name");