import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const PLATFORM_ADMIN_ROLES = new Set(["admin", "superadmin"]);
const AGENT_TABLE_ROLES = new Set(["agent", "admin", "superadmin", "regional_head"]);

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env to enable admin provisioning.",
        },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!accessToken) {
      return NextResponse.json(
        { error: "You must be signed in as a platform admin." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password, fullName, role, territory, agentTier, reportsToAgentId, subAgentSplitPercent } = body as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: string;
      territory?: string;
      agentTier?: "regional_head" | "field_agent";
      reportsToAgentId?: string | null;
      subAgentSplitPercent?: number | null;
    };

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "Email, password, full name, and role are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (callerError || !caller?.email) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: adminProfile, error: adminLookupError } = await supabaseAdmin
      .from("users")
      .select("global_role")
      .eq("email", caller.email)
      .maybeSingle();

    if (adminLookupError) {
      return NextResponse.json(
        { error: "Failed to verify admin permissions: " + adminLookupError.message },
        { status: 500 }
      );
    }

    if (!PLATFORM_ADMIN_ROLES.has(adminProfile?.global_role ?? "")) {
      return NextResponse.json(
        { error: "Only platform admins can provision new users." },
        { status: 403 }
      );
    }

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
          global_role: role,
          territory: territory ?? null,
        },
      });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!createdUser.user) {
      return NextResponse.json(
        { error: "User creation failed unexpectedly." },
        { status: 500 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { error: profileError } = await supabaseAdmin.from("users").upsert(
      {
        email: normalizedEmail,
        full_name: fullName,
        global_role: role,
      },
      { onConflict: "email" }
    );

    if (profileError) {
      return NextResponse.json(
        { error: "Auth user created but profile sync failed: " + profileError.message },
        { status: 500 }
      );
    }

    if (AGENT_TABLE_ROLES.has(role)) {
      const { data: existingAgent } = await supabaseAdmin
        .from("agents")
        .select("id")
        .eq("user_email", normalizedEmail)
        .maybeSingle();

      const tier =
        role === "regional_head"
          ? "regional_head"
          : agentTier === "field_agent"
            ? "field_agent"
            : "regional_head";
      const agentPayload: Record<string, unknown> = {
        user_id: createdUser.user.id,
        user_email: normalizedEmail,
        status: "active",
        commission_rate: 0,
        agent_tier: tier,
      };

      if (tier === "field_agent") {
        if (!reportsToAgentId) {
          return NextResponse.json(
            { error: "Field agents must be assigned to a regional head." },
            { status: 400 }
          );
        }
        const { data: headAgent, error: headError } = await supabaseAdmin
          .from("agents")
          .select("id, agent_tier")
          .eq("id", reportsToAgentId)
          .maybeSingle();
        if (headError || !headAgent?.id || headAgent.agent_tier !== "regional_head") {
          return NextResponse.json(
            { error: "Selected regional head is invalid." },
            { status: 400 }
          );
        }
        agentPayload.reports_to_agent_id = reportsToAgentId;
        agentPayload.sub_agent_split_percent =
          subAgentSplitPercent == null
            ? 50
            : Math.min(100, Math.max(0, Number(subAgentSplitPercent) || 0));
      }

      if (!existingAgent) {
        const { error: agentError } = await supabaseAdmin.from("agents").insert(agentPayload);

        if (agentError) {
          return NextResponse.json(
            { error: "User created but agent record failed: " + agentError.message },
            { status: 500 }
          );
        }
      } else {
        await supabaseAdmin
          .from("agents")
          .update({ user_id: createdUser.user.id, user_email: normalizedEmail })
          .eq("id", existingAgent.id);
      }
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: createdUser.user.id,
        role,
      },
      { onConflict: "user_id,role" }
    );

    if (roleError) {
      // user_roles may not exist on all deployments; non-fatal
      console.warn("user_roles upsert skipped:", roleError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully provisioned ${normalizedEmail} as ${role}.`,
      userId: createdUser.user.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Provisioning failed: " + message },
      { status: 500 }
    );
  }
}
