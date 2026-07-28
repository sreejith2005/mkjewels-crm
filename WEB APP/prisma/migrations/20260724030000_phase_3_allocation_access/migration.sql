-- Phase 3: salespeople can see their own branch roster, while only managers
-- (and the existing super-admin policy) can change allocation/availability.
DROP POLICY IF EXISTS "branch_staff_own_allocations" ON "crm_allocation";
DROP POLICY IF EXISTS "branch_staff_own_availability" ON "crm_daily_availability";

CREATE POLICY "branch_staff_read_own_allocations" ON "crm_allocation"
FOR SELECT TO authenticated USING ("public"."is_branch_staff"("branch_id"));
CREATE POLICY "branch_manager_write_own_allocations" ON "crm_allocation"
FOR INSERT TO authenticated WITH CHECK ("public"."is_branch_manager"("branch_id"));
CREATE POLICY "branch_manager_update_own_allocations" ON "crm_allocation"
FOR UPDATE TO authenticated USING ("public"."is_branch_manager"("branch_id")) WITH CHECK ("public"."is_branch_manager"("branch_id"));

CREATE POLICY "branch_staff_read_own_availability" ON "crm_daily_availability"
FOR SELECT TO authenticated USING ("public"."is_branch_staff"("branch_id"));
CREATE POLICY "branch_manager_write_own_availability" ON "crm_daily_availability"
FOR INSERT TO authenticated WITH CHECK ("public"."is_branch_manager"("branch_id"));
CREATE POLICY "branch_manager_update_own_availability" ON "crm_daily_availability"
FOR UPDATE TO authenticated USING ("public"."is_branch_manager"("branch_id")) WITH CHECK ("public"."is_branch_manager"("branch_id"));
CREATE POLICY "branch_manager_delete_own_availability" ON "crm_daily_availability"
FOR DELETE TO authenticated USING ("public"."is_branch_manager"("branch_id"));
