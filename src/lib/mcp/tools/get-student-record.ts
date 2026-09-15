import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_student_record",
  title: "Get student record",
  description:
    "Fetch one student's profile with their recent grades and attendance summary, by student UUID or admission number.",
  inputSchema: {
    student: z.string().trim().min(1).describe("Student UUID or admission number (e.g. M/P01/06)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ student }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student);

    const { data: row, error } = await supabase
      .from("students")
      .select("*")
      .eq(isUuid ? "id" : "student_id", student)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!row) return { content: [{ type: "text", text: "No student found or not visible to you." }], isError: true };

    const [{ data: grades }, { data: attendance }] = await Promise.all([
      supabase.from("grades").select("*").eq("student_id", row.id).limit(50),
      supabase.from("attendance").select("status, date").eq("student_id", row.id).order("date", { ascending: false }).limit(60),
    ]);

    const result = {
      student: { ...row, parent_code: undefined },
      grades: grades ?? [],
      recent_attendance: attendance ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
