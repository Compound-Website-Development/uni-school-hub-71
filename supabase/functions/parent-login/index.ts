import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const BodySchema = z.object({
  parentId: z.string().trim().min(4).max(32),
  code: z.string().trim().min(4).max(32),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    })

  try {
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) return json({ error: 'Enter a valid Parent ID and access code.' }, 400)

    const parentId = parsed.data.parentId.toUpperCase()
    const code = parsed.data.code.toUpperCase()

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    const { data: students, error } = await admin
      .from('students')
      .select('id, first_name, last_name, guardian_name, guardian_email, parent_code')
      .eq('parent_id', parentId)

    if (error) return json({ error: 'Unable to verify right now. Try again.' }, 500)
    if (!students || students.length === 0 || students[0].parent_code?.toUpperCase() !== code) {
      return json({ error: 'Parent ID or access code is incorrect.' }, 401)
    }

    const email = `parent.${parentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@imagemakers.local`
    const password = `${parentId}#${code}#ims`

    // Find or create the parent auth user
    let userId: string | null = null
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users?.find((u) => u.email === email)

    if (existing) {
      userId = existing.id
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true })
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'parent',
          first_name: students[0].guardian_name ?? 'Parent',
          last_name: students[0].last_name ?? '',
        },
      })
      if (createErr || !created.user) return json({ error: 'Could not create the parent account.' }, 500)
      userId = created.user.id
    }

    await admin.from('user_roles').upsert({ user_id: userId, role: 'parent' }, { onConflict: 'user_id,role' })

    for (const s of students) {
      const { data: link } = await admin
        .from('parent_student_links')
        .select('id')
        .eq('parent_user_id', userId)
        .eq('student_id', s.id)
        .maybeSingle()
      if (!link) {
        await admin.from('parent_student_links').insert({
          parent_user_id: userId,
          student_id: s.id,
          relation: 'guardian',
        })
      }
    }

    return json({
      email,
      password,
      children: students.map((s) => `${s.first_name} ${s.last_name}`),
    })
  } catch (_e) {
    return json({ error: 'Unexpected error. Please try again.' }, 500)
  }
})
