import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  homework: `You are a friendly, encouraging AI tutor for pupils at Imagemakers Nursery and Primary School in Lagos, Nigeria. Your name is Imagemakers AI Tutor.
You help students understand their homework and learn concepts. You:
- Explain concepts clearly with examples relevant to the Nigerian nursery/primary curriculum
- For homework and problem-solving questions, do not simply provide the final answer; explain the method, ask guiding questions, and use similar examples so the pupil learns the skill.\n- For straightforward factual or general-knowledge questions, answer the question clearly and accurately. If the premise is mistaken or historically uncertain, correct it gently.
- Use very simple English appropriate for children aged 3-12
- Encourage students when they're struggling
- Cover primary subjects: Mathematics, English, Basic Science, Social Studies, Verbal/Quantitative Reasoning, CRS, Yoruba, Computer Studies
- Keep responses concise and well-formatted with markdown`,

  report_comment: `You are an experienced Nigerian nursery and primary school teacher writing report card comments for pupils at Imagemakers Nursery and Primary School.
Generate professional, personalized teacher comments for student report cards based on the student's performance data provided.
If the data is a financial_forecast type, you are a financial intelligence AI analyzing school fee collection data.
Provide insights on:
- Current collection efficiency and trends
- Risk assessment for defaulters
- Projected revenue based on current patterns
- Actionable recommendations to improve collection rates
Keep the analysis concise (3-5 bullet points) and data-driven.
Guidelines for student comments:
- Be encouraging but honest
- Mention specific strengths and areas for improvement
- Use proper English suitable for official school reports
- Keep comments between 2-4 sentences
- Reference the student's grades/scores when relevant
- Suggest actionable next steps for improvement`,
};

const MAX_MESSAGES = 30;
const MAX_CONTENT_LENGTH = 4000;
const MAX_STUDENT_DATA_LENGTH = 4000;

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Only user/assistant turns from the caller are accepted; system instructions are set here. */
const sanitizeMessages = (raw: unknown): ChatMessage[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        !!m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_LENGTH) }));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only signed-in portal users may spend AI credits.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Sign in to use the assistant." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await caller.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Sign in to use the assistant." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const requestedType = typeof body?.type === "string" ? body.type : "homework";
    const type = requestedType in SYSTEM_PROMPTS ? requestedType : "homework";
    const messages = sanitizeMessages(body?.messages);
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No message provided." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = SYSTEM_PROMPTS[type];

    // For report comments, append student data context
    if (type === "report_comment" && body?.studentData) {
      systemPrompt += `\n\nStudent Performance Data:\n${JSON.stringify(body.studentData).slice(0, MAX_STUDENT_DATA_LENGTH)}`;
    }

    const useStreaming = type === "homework";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: useStreaming,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact the administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (useStreaming) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      const comment = data.choices?.[0]?.message?.content || "Unable to generate comment.";
      return new Response(JSON.stringify({ comment }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
