"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { revalidatePath } from "next/cache";

export async function fetchAdminStaffRolesAndGrades() {
  const result = await withAdminDb(async (supabase) => {
    const [rolesRes, gradesRes] = await Promise.all([
      supabase.from("global_staff_roles").select("*").order("category"),
      supabase.from("global_skill_grades").select("*").order("created_at"),
    ]);

    if (rolesRes.error) {
      throw new Error(rolesRes.error.message);
    }
    
    // Ignore error for grades if table doesn't exist yet in case migration hasn't run
    const gradesData = gradesRes.error ? [] : gradesRes.data || [];

    return {
      roles: rolesRes.data || [],
      grades: gradesData,
    };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function createAdminStaffRole(category: string, role_name: string) {
  const result = await withAdminDb(async (supabase) => {
    const res = await supabase
      .from("global_staff_roles")
      .insert([{ category, role_name }])
      .select()
      .single();

    if (res.error) throw new Error(res.error.message);
    return { role: res.data };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/admin/staff-roles");
  return { success: true as const, role: result.data.role };
}

export async function deleteAdminStaffRole(id: string) {
  const result = await withAdminDb(async (supabase) => {
    const res = await supabase.from("global_staff_roles").delete().eq("id", id);
    if (res.error) throw new Error(res.error.message);
    return true;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/admin/staff-roles");
  return { success: true as const };
}

export async function createAdminSkillGrade(name: string) {
  const result = await withAdminDb(async (supabase) => {
    const res = await supabase
      .from("global_skill_grades")
      .insert([{ name }])
      .select()
      .single();

    if (res.error) throw new Error(res.error.message);
    return { grade: res.data };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/admin/staff-roles");
  return { success: true as const, grade: result.data.grade };
}

export async function deleteAdminSkillGrade(id: string) {
  const result = await withAdminDb(async (supabase) => {
    const res = await supabase.from("global_skill_grades").delete().eq("id", id);
    if (res.error) throw new Error(res.error.message);
    return true;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/admin/staff-roles");
  return { success: true as const };
}
