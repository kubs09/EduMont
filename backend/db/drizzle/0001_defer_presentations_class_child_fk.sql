-- Custom SQL migration file, put you code below! --

-- Postgres checks FK constraints immediately after each statement by default.
-- Reassigning a child's class requires updating both class_children and
-- presentations.class_id (which references class_children via a composite
-- FK), and class_children.child_id is unique (one class per child), so there
-- is no statement ordering that keeps both tables consistent at every
-- intermediate step within the same transaction. Deferring the check to
-- COMMIT time allows the two updates to land in either order, as long as the
-- transaction ends in a consistent state.
ALTER TABLE "presentations" DROP CONSTRAINT "fk_presentations_class_child";
--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "fk_presentations_class_child" FOREIGN KEY ("class_id","child_id") REFERENCES "public"."class_children"("class_id","child_id") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;
