"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import {
  GENERIC_INVALID_CREDENTIALS,
  landingPathForSession,
  type LoginPortal,
} from "@/lib/auth/personas";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).optional(),
});

export async function signUpAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  redirect("/verify-email");
}

export async function signInAction(formData: FormData) {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: GENERIC_INVALID_CREDENTIALS };

  const portal = (String(formData.get("portal") || "company") as LoginPortal) || "company";
  const requestedNext = String(formData.get("next") || "");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: GENERIC_INVALID_CREDENTIALS };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  const { roleCodes } = await getRoleCodesForUser(supabase, user.id);
  const landing = landingPathForSession({
    portal,
    isPlatformAdmin: Boolean(profile?.is_platform_admin),
    roleCodes,
  });

  if (!landing) {
    await supabase.auth.signOut();
    return { error: GENERIC_INVALID_CREDENTIALS };
  }

  const next =
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    portal !== "admin" &&
    (portal !== "company" || !landing.startsWith("/field")) &&
    (portal !== "contractor" || requestedNext.startsWith("/contractor"))
      ? requestedNext
      : landing;

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  if (!z.string().email().safeParse(email).success) {
    return { error: "Enter a valid email address" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: "Password reset email sent if the account exists." };
}

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/login?reset=1");
}
