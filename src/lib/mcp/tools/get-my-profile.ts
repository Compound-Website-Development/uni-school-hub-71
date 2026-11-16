import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my profile",
  description: "Return the signed-in user's profile and role in the school portal.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [{ data: profile, error: pErr }, { data: role, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    ]);
    const error = pErr ?? rErr;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const result = { email: ctx.getUserEmail(), profile, role: role?.role ?? null };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
