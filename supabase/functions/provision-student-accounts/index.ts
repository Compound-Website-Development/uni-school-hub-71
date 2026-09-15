import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Readable, reasonably strong password: Ims-<word><4 digits> */
const makePassword = () => {
  const words = ["Sky", "Light", "Wisdom", "Pearl", "Emerald", "Topaz", "Ruby", "Zircon", "Faith", "Hope"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Ims-${w}${n}`;
};

/**
 * Pupils rarely have their own mailbox, so the login address is derived
 * deterministically from the admission number. Password reset by email is not
 * available for these accounts — an admin re-issues the password instead.
 */
const loginEmail = (admissionNo: string) =>
  `pupil.${admissionNo.toLowerCase().replace(/[^a-z0-9]/g, "")}@imagemakers.local`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsError } = await caller.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, serviceKey);

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    let classId: string | null = null;
    let onlyStudentIds: string[] | null = null;
    try {
      const body = await req.json();
      classId = body?.class_id ?? null;
      onlyStudentIds = Array.isArray(body?.student_ids) && body.student_ids.length ? body.student_ids : null;
    } catch { /* no body — provision every pupil without a login */ }

    let query = admin
      .from("students")
      .select("id, student_id, first_name, last_name, user_id, class_id, classes(name)")
      .is("user_id", null)
      .eq("status", "active")
      .order("student_id");
    if (classId) query = query.eq("class_id", classId);
    if (onlyStudentIds) query = query.in("id", onlyStudentIds);

    const { data: students, error: studentsError } = await query;
    if (studentsError) throw studentsError;

    const { data: existingUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byEmail = new Map((existingUsers?.users ?? []).map((u) => [u.email?.toLowerCase(), u]));

    const results: Array<Record<string, unknown>> = [];

    for (const s of students ?? []) {
      const name = `${s.first_name} ${s.last_name}`;
      const className = (s as any).classes?.name ?? null;

      if (!s.student_id) {
        results.push({ name, email: null, password: null, class_name: className, status: "error: no admission number" });
        continue;
      }

      const email = loginEmail(String(s.student_id));
      const existing = byEmail.get(email);

      if (existing) {
        await admin.from("students").update({ user_id: existing.id }).eq("id", s.id);
        await admin.from("user_roles").upsert({ user_id: existing.id, role: "student" }, { onConflict: "user_id,role" });
        results.push({
          name,
          admission_no: s.student_id,
          email,
          password: null,
          class_name: className,
          status: "already_existed",
        });
        continue;
      }

      const password = makePassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "student" },
        user_metadata: { first_name: s.first_name, last_name: s.last_name },
      });

      if (createError || !created?.user) {
        results.push({
          name,
          admission_no: s.student_id,
          email,
          password: null,
          class_name: className,
          status: `error: ${createError?.message ?? "unknown"}`,
        });
        continue;
      }

      await admin.from("students").update({ user_id: created.user.id }).eq("id", s.id);
      await admin.from("user_roles").upsert({ user_id: created.user.id, role: "student" }, { onConflict: "user_id,role" });

      results.push({
        name,
        admission_no: s.student_id,
        email,
        password,
        class_name: className,
        status: "created",
      });
    }

    return json({ count: results.length, accounts: results });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
