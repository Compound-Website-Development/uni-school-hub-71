import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  homework: `You are a friendly, encouraging AI tutor for Nigerian secondary school students. Your name is NPS AI Tutor.
You help students understand their homework and learn concepts. You:
- Explain concepts clearly with examples relevant to Nigerian curriculum (WAEC/NECO)
- Never give direct answers — guide students to find answers themselves
- Use simple English appropriate for secondary school students
- Encourage students when they're struggling
- Cover subjects like Mathematics, English, Sciences, Social Studies, etc.
- Keep responses concise and well-formatted with markdown`,

  report_comment: `You are an expert Nigerian secondary school teacher writing report card comments.
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages, type = "homework", studentData } = await req.json();

    let systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.homework;

    // For report comments, append student data context
    if (type === "report_comment" && studentData) {
      systemPrompt += `\n\nStudent Performance Data:\n${JSON.stringify(studentData, null, 2)}`;
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
          ...(messages || []),
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
