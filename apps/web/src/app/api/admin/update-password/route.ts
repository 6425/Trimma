import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

export async function POST(request: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and new password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!serviceRoleKey) {
      return NextResponse.json(
        { 
          error: "SUPABASE_SERVICE_ROLE_KEY is missing from your .env file.", 
          help: "Please add 'SUPABASE_SERVICE_ROLE_KEY=your_key_here' to your .env file to enable manual password overrides. You can find this key in your Supabase Dashboard under Project Settings -> API -> service_role."
        },
        { status: 500 }
      );
    }

    // Initialize Supabase Admin Client using the powerful Service Role Key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Fetch up to 1000 users to locate the user with matching email
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });
    
    if (listError) {
      return NextResponse.json(
        { error: "Failed to query Supabase Auth users list: " + listError.message },
        { status: 500 }
      );
    }

    const targetUser = (usersData?.users || []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      // 2. Automatically register pre-seeded profiles in Supabase Auth safely!
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
      });

      if (createError) {
        return NextResponse.json(
          { error: `User profile exists but login activation failed: ${createError.message}. Make sure to execute the FIX_SUPABASE_AUTH_SYNC_TRIGGER.sql script in your Supabase SQL Editor!` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully registered and activated login credentials for pre-seeded user ${email}!`
      });
    }

    // 2. Overwrite password securely if account already exists
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: password }
    );

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to overwrite password: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated password for ${email}!`
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: "An unexpected error occurred: " + err.message },
      { status: 500 }
    );
  }
}
