import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const hex = (bytes: Uint8Array) => Array.from(bytes).map(x=>x.toString(16).padStart(2,"0")).join("");
const encoder = new TextEncoder();

async function sha256(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Staff sign-in is required." }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(authorization.slice(7));
    if (authError || !authData.user) return json({ error: "Staff session is invalid or expired." }, 401);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: roleRows, error: roleError } = await admin.from("user_roles")
      .select("role").eq("user_id", authData.user.id).in("role", ["admin", "teacher"]);
    if (roleError || !roleRows?.length) return json({ error: "Only authorised school staff can prepare exam packages." }, 403);

    const body = await req.json();
    const examId = body?.examId;
    if (typeof examId !== "string" || !/^[0-9a-f-]{36}$/i.test(examId)) return json({ error: "A valid exam ID is required." }, 400);

    const { data: exam, error: examError } = await admin.from("exams")
      .select("id,title,description,subject_id,class_id,duration_minutes,start_time,end_time,is_published,status,delivery_mode,created_at,subjects(name),classes(name,arm,class_teacher_id)")
      .eq("id", examId).single();
    if (examError || !exam) return json({ error: "Exam was not found." }, 404);
    if (exam.delivery_mode !== "desktop_offline") return json({ error: "This exam is configured for browser practice, not the Windows CBT station." }, 409);
    if (!(exam.is_published || exam.status === "active")) return json({ error: "Publish or activate the exam before preparing a desktop package." }, 409);
    if (!exam.subject_id || !exam.class_id || !exam.start_time || !exam.end_time || !exam.duration_minutes || exam.duration_minutes < 1) {
      return json({ error: "Exam must have a subject, class/arm, duration and start/end window." }, 422);
    }
    if (Date.parse(exam.end_time) <= Date.parse(exam.start_time)) return json({ error: "Exam end time must be after its start time." }, 422);

    const isAdmin = roleRows.some(r => r.role === "admin");
    if (!isAdmin) {
      const { data: assignment } = await admin.from("class_subjects").select("id")
        .eq("class_id", exam.class_id).eq("subject_id", exam.subject_id).eq("teacher_id", authData.user.id).maybeSingle();
      const klass = Array.isArray(exam.classes) ? exam.classes[0] : exam.classes;
      if (!assignment && klass?.class_teacher_id !== authData.user.id) {
        return json({ error: "You are not assigned to this class and subject." }, 403);
      }
    }

    const [{ data: questions, error: questionError }, { data: students, error: studentError }] = await Promise.all([
      admin.from("exam_questions").select("id,question_text,options,correct_index,points").eq("exam_id", examId).order("created_at"),
      admin.from("students").select("id,student_id,first_name,middle_name,last_name,class_id,status")
        .eq("class_id", exam.class_id).eq("status", "active").order("student_id"),
    ]);
    if (questionError) throw questionError;
    if (studentError) throw studentError;
    if (!questions?.length || questions.length > 500) return json({ error: "Add between 1 and 500 questions before preparing the package." }, 422);
    if (!students?.length || students.length > 1000) return json({ error: "No eligible active candidates were found for this class/arm." }, 422);

    const safeQuestions = questions.map((q: any) => {
      const options = Array.isArray(q.options) ? q.options : [];
      if (!q.question_text || options.length < 2 || options.length > 6 ||
          !Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index >= options.length) {
        throw new Error("Every objective question must have 2–6 options and a valid correct answer.");
      }
      return {
        id: q.id,
        prompt: q.question_text,
        options: options.map((text: string, i: number) => ({ id: String.fromCharCode(65+i), text })),
        points: Number(q.points || 1),
      };
    });
    const klass = Array.isArray(exam.classes) ? exam.classes[0] : exam.classes;
    const subject = Array.isArray(exam.subjects) ? exam.subjects[0] : exam.subjects;
    const candidates = students.map((s: any) => ({
      studentId: s.id,
      admissionNumber: s.student_id,
      displayName: [s.first_name,s.middle_name,s.last_name].filter(Boolean).join(" "),
      classId: s.class_id,
      className: klass?.name || "Class",
      armId: s.class_id,
      armName: klass?.arm || "",
    }));
    const { data: latest } = await admin.from("cbt_exam_package_versions").select("version")
      .eq("exam_id", examId).order("version", { ascending: false }).limit(1).maybeSingle();
    const version = (latest?.version || 0) + 1;
    const payload = {
      schemaVersion: 1,
      id: examId + "-v" + version,
      schoolId: "imagemakers",
      sessionId: exam.created_at,
      examId,
      version,
      title: exam.title,
      subject: subject?.name || "General",
      classId: exam.class_id,
      className: klass?.name || "Class",
      armId: exam.class_id,
      armName: klass?.arm || "",
      opensAt: exam.start_time,
      closesAt: exam.end_time,
      durationSeconds: Number(exam.duration_minutes) * 60,
      instructions: exam.description || "Read each question carefully. You may move between questions and change answers before submitting.",
      questions: safeQuestions,
      answerKey: questions.map((q: any) => ({ questionId:q.id, correctOptionId:String.fromCharCode(65+q.correct_index), points:Number(q.points||1) })),
      candidates,
    };
    const canonical = JSON.stringify(payload);
    const packageHash = await sha256(canonical);
    const { data: keyData, error: keyError } = await admin.rpc("get_cbt_package_signing_key");
    if (keyError || typeof keyData !== "string" || !keyData) {
      return json({ error: "The school's package signing key is not configured. Contact the system administrator." }, 503);
    }
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      Uint8Array.from(atob(keyData), c => c.charCodeAt(0)),
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", privateKey, encoder.encode(canonical)));
    const { error: versionError } = await admin.from("cbt_exam_package_versions").insert({
      exam_id: examId, version, package_hash: packageHash, published_by: authData.user.id,
    });
    if (versionError) throw versionError;

    return json({
      payload,
      signature: b64(signature),
      packageHash,
      format: "imagemakers-cbt-json-envelope-v1",
    });
  } catch (error) {
    console.error("cbt-exam-package failed", error);
    return json({ error: error instanceof Error ? error.message : "Could not prepare exam package." }, 400);
  }
});
