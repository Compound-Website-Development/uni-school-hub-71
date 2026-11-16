import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) => Array.from(bytes).map(x=>x.toString(16).padStart(2,"0")).join("");
const validUuid = (v: unknown) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

async function digest(value: string) {
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
    if (roleError || !roleRows?.length) return json({ error: "Only authorised school staff can synchronise CBT attempts." }, 403);
    const isAdmin = roleRows.some(r => r.role === "admin");

    const body = await req.json();
    if (!Array.isArray(body?.attempts) || body.attempts.length < 1 || body.attempts.length > 25) {
      return json({ error: "Send between 1 and 25 completed attempts per sync batch." }, 400);
    }
    const results = [];
    for (const item of body.attempts) {
      try {
        const { attemptId, examId, studentId, admissionNumber, examVersion, packageHash, startedAt, deadlineAt, submittedAt, answers, payloadHash, clockWarning } = item || {};
        if (!validUuid(attemptId) || !validUuid(examId) || !validUuid(studentId) ||
            typeof admissionNumber !== "string" || admissionNumber.length > 40 ||
            !Number.isInteger(examVersion) || typeof packageHash !== "string" || !/^[a-f0-9]{64}$/.test(packageHash) ||
            typeof answers !== "object" || answers === null || Array.isArray(answers)) {
          throw new Error("Attempt payload is malformed.");
        }
        const canonical = { attemptId, examId, studentId, examVersion, packageHash, startedAt, deadlineAt, submittedAt, answers };
        if (typeof payloadHash !== "string" || await digest(JSON.stringify(canonical)) !== payloadHash) {
          throw new Error("Attempt payload integrity check failed.");
        }
        const start = Date.parse(startedAt), deadline = Date.parse(deadlineAt), submitted = Date.parse(submittedAt);
        if (![start,deadline,submitted].every(Number.isFinite) || submitted < start || submitted > Date.now()+300000 ||
            deadline < start || submitted > deadline+120000 || (clockWarning === true)) {
          throw new Error("Attempt timestamps or device clock require staff review.");
        }

        const { data: exam, error: examError } = await admin.from("exams")
          .select("id,subject_id,class_id,status,is_published,delivery_mode,start_time,end_time,duration_minutes")
          .eq("id", examId).single();
        if (examError || !exam) throw new Error("The original exam no longer exists.");
        if (exam.delivery_mode !== "desktop_offline") throw new Error("This exam is not assigned to the offline desktop CBT platform.");
        if (!(exam.is_published || exam.status === "active" || exam.status === "completed")) throw new Error("This exam is not published for official results.");
        if (!exam.start_time || !exam.end_time || !exam.duration_minutes) throw new Error("The original exam has no valid schedule.");
        const examStart = Date.parse(exam.start_time), examEnd = Date.parse(exam.end_time);
        if (start < examStart-60000 || start > examEnd+60000 || deadline > start+Number(exam.duration_minutes)*60000+120000) {
          throw new Error("Attempt does not match the published exam window or duration.");
        }

        const { data: packageVersion, error: versionError } = await admin.from("cbt_exam_package_versions")
          .select("package_hash").eq("exam_id",examId).eq("version",examVersion).single();
        if (versionError || packageVersion?.package_hash !== packageHash) throw new Error("The exam package version or hash is not recognised by the school server.");

        const { data: student, error: studentError } = await admin.from("students")
          .select("id,student_id,class_id,status").eq("id",studentId).single();
        if (studentError || !student || student.status !== "active" || student.class_id !== exam.class_id ||
            student.student_id.toUpperCase() !== admissionNumber.toUpperCase()) {
          throw new Error("Candidate is not currently eligible for this exam.");
        }
        if (!isAdmin) {
          const [{ data: assignment }, { data: klass }] = await Promise.all([
            admin.from("class_subjects").select("id").eq("class_id",exam.class_id).eq("subject_id",exam.subject_id).eq("teacher_id",authData.user.id).maybeSingle(),
            admin.from("classes").select("class_teacher_id").eq("id",exam.class_id).single(),
          ]);
          if (!assignment && klass?.class_teacher_id !== authData.user.id) throw new Error("You are not authorised to manage this class and subject.");
        }

        const { data: questions, error: questionError } = await admin.from("exam_questions")
          .select("id,options,correct_index,points").eq("exam_id",examId);
        if (questionError || !questions?.length) throw new Error("The exam question set is unavailable.");
        const qMap = new Map(questions.map((q: any) => [q.id,q]));
        let score = 0, totalPoints = 0;
        for (const [questionId, answerIndex] of Object.entries(answers)) {
          const q: any = qMap.get(questionId);
          if (!q || !Number.isInteger(answerIndex) || Number(answerIndex) < 0 || Number(answerIndex) >= q.options.length) {
            throw new Error("An answer refers to an unknown question or option.");
          }
        }
        for (const q of questions) {
          const points = Number(q.points || 1);
          totalPoints += points;
          if (Number.isInteger(q.correct_index) && answers[q.id] === q.correct_index) score += points;
        }
        if (totalPoints <= 0 || score < 0 || score > totalPoints) throw new Error("Calculated score is invalid.");

        const { data: receipt, error: receiptError } = await admin.rpc("record_cbt_sync_attempt", {
          _attempt_id:attemptId, _exam_id:examId, _student_id:studentId, _exam_version:examVersion,
          _package_hash:packageHash, _answers:answers, _score:score, _total_points:totalPoints,
          _payload_hash:payloadHash, _received_by:authData.user.id, _submitted_at:submittedAt,
        });
        if (receiptError) throw receiptError;
        results.push({ attemptId, success:true, duplicate:!!receipt?.duplicate, submissionId:receipt?.submission_id, score:receipt?.score, totalPoints:receipt?.total_points });
      } catch (error) {
        results.push({ attemptId:item?.attemptId||null, success:false, error:error instanceof Error?error.message:"Attempt sync failed." });
      }
    }
    return json({ results });
  } catch (error) {
    console.error("cbt-sync failed", error);
    return json({ error:error instanceof Error?error.message:"Could not synchronise CBT attempts." }, 400);
  }
});
