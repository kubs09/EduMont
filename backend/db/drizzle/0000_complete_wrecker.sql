CREATE TYPE "public"."user_role" AS ENUM('admin', 'teacher', 'parent');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_presentations" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"age_group" varchar(50) NOT NULL,
	"display_order" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "category_presentations_age_group_check" CHECK ("category_presentations"."age_group" in ('Infant', 'Toddler', 'Early Childhood', 'Lower Elementary', 'Upper Elementary', 'Middle School'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "child_excuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"parent_id" integer,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "child_excuses_date_bounds_check" CHECK ("child_excuses"."date_to" >= "child_excuses"."date_from")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "child_parents" (
	"child_id" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "child_parents_child_id_parent_id_pk" PRIMARY KEY("child_id","parent_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "children" (
	"id" serial PRIMARY KEY NOT NULL,
	"firstname" varchar(100) NOT NULL,
	"surname" varchar(100) NOT NULL,
	"date_of_birth" date NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"child_id" integer NOT NULL,
	"attendance_date" date DEFAULT CURRENT_DATE NOT NULL,
	"check_in_at" timestamp,
	"check_out_at" timestamp,
	"checked_in_by" integer,
	"checked_out_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_children" (
	"class_id" integer,
	"child_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "class_children_class_id_child_id_pk" PRIMARY KEY("class_id","child_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer,
	"date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_teachers" (
	"class_id" integer,
	"teacher_id" integer,
	"role" varchar(20) NOT NULL,
	"permission_requested" boolean DEFAULT false,
	CONSTRAINT "class_teachers_class_id_teacher_id_pk" PRIMARY KEY("class_id","teacher_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"age_group" varchar(50) NOT NULL,
	"min_age" integer NOT NULL,
	"max_age" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "classes_age_group_check" CHECK ("classes"."age_group" in ('Infant', 'Toddler', 'Early Childhood', 'Lower Elementary', 'Upper Elementary', 'Middle School')),
	CONSTRAINT "classes_age_bounds_check" CHECK ("classes"."min_age" >= 0 and "classes"."max_age" >= "classes"."min_age")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_name" varchar(255),
	"mime_type" varchar(100),
	"size_bytes" integer,
	"class_id" integer,
	"child_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "documents_size_bytes_check" CHECK ("documents"."size_bytes" is null or "documents"."size_bytes" >= 0),
	CONSTRAINT "documents_target_check" CHECK ("documents"."class_id" is not null or "documents"."child_id" is not null)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(100) NOT NULL,
	"token" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"from_user_id" integer,
	"to_user_id" integer,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"deleted_by_sender" boolean DEFAULT false,
	"deleted_by_recipient" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "presentation_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"permission_requested" boolean DEFAULT false,
	"granted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "presentation_permissions_granted_check" CHECK ("presentation_permissions"."granted" = false or "presentation_permissions"."permission_requested" = true)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "presentations" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" varchar(100),
	"display_order" integer DEFAULT 0,
	"status" varchar(30) DEFAULT 'prerequisites not met' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer,
	CONSTRAINT "presentations_status_check" CHECK ("presentations"."status" in ('prerequisites not met', 'to be presented', 'presented', 'practiced', 'mastered'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(100) NOT NULL,
	"firstname" varchar(100) NOT NULL,
	"surname" varchar(100) NOT NULL,
	"password" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"reset_token" varchar(64),
	"reset_token_expiry" timestamp,
	"message_notifications" boolean DEFAULT true,
	"phone" varchar(20)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_excuses" ADD CONSTRAINT "child_excuses_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_excuses" ADD CONSTRAINT "child_excuses_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_parents" ADD CONSTRAINT "child_parents_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_parents" ADD CONSTRAINT "child_parents_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_attendance" ADD CONSTRAINT "class_attendance_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_attendance" ADD CONSTRAINT "class_attendance_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_attendance" ADD CONSTRAINT "class_attendance_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_attendance" ADD CONSTRAINT "class_attendance_checked_out_by_users_id_fk" FOREIGN KEY ("checked_out_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_children" ADD CONSTRAINT "class_children_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_children" ADD CONSTRAINT "class_children_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_history" ADD CONSTRAINT "class_history_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_history" ADD CONSTRAINT "class_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentation_permissions" ADD CONSTRAINT "presentation_permissions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentation_permissions" ADD CONSTRAINT "presentation_permissions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentations" ADD CONSTRAINT "presentations_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentations" ADD CONSTRAINT "presentations_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentations" ADD CONSTRAINT "presentations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentations" ADD CONSTRAINT "presentations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentations" ADD CONSTRAINT "fk_presentations_class_child" FOREIGN KEY ("class_id","child_id") REFERENCES "public"."class_children"("class_id","child_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "category_presentations_category_age_display_unique" ON "category_presentations" USING btree ("category","age_group","display_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_category_presentations_category" ON "category_presentations" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_category_presentations_age_group" ON "category_presentations" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_category_presentations_category_age" ON "category_presentations" USING btree ("category","age_group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_excuses_child_id" ON "child_excuses" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_excuses_parent_id" ON "child_excuses" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_excuses_date_from" ON "child_excuses" USING btree ("date_from");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_parents_parent_id" ON "child_parents" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_attendance_class_child_date_unique" ON "class_attendance" USING btree ("class_id","child_id","attendance_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_attendance_class_date" ON "class_attendance" USING btree ("class_id","attendance_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_attendance_child_date" ON "class_attendance" USING btree ("child_id","attendance_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_children_child_id_unique" ON "class_children" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_history_class_id" ON "class_history" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_history_date" ON "class_history" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_teachers_class_role_unique" ON "class_teachers" USING btree ("class_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_class_teachers_teacher_id_unique" ON "class_teachers" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_class_id" ON "documents" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_child_id" ON "documents" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_created_by" ON "documents" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_from_user" ON "messages" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_to_user" ON "messages" USING btree ("to_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "presentation_permissions_admin_class_unique" ON "presentation_permissions" USING btree ("admin_id","class_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_presentation_permissions_admin_id" ON "presentation_permissions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_presentation_permissions_class_id" ON "presentation_permissions" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_presentation_permissions_requested" ON "presentation_permissions" USING btree ("permission_requested") WHERE "presentation_permissions"."permission_requested" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_presentations_child_id" ON "presentations" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_presentations_class_id" ON "presentations" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_presentations_status" ON "presentations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_presentations_category_status" ON "presentations" USING btree ("category","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_presentations_child_category" ON "presentations" USING btree ("child_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_reset_token" ON "users" USING btree ("reset_token");