import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_students",
  title: "List students",
  description:
    "List students visible to the signed-in user, optionally filtered by name/admission number or class.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Match student name or admission number."),
    class_id: z.string().uuid().optional().describe("Restrict results to one class."),
    limit: z.number().int().min(1).max(100).default(25).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, class_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("students")
      .select("id, student_id, first_name, last_name, class_id, status, section, guardian_name, guardian_phone")
      .order("last_name", { ascending: true })
      .limit(limit ?? 25);

    if (class_id) query = query.eq("class_id", class_id);
    if (search) {
      const s = search.replace(/[%,]/g, " ");
      query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,student_id.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { students: data ?? [] },
    };
  },
});
