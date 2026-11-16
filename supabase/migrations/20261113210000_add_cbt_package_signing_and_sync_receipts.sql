create table if not exists public.cbt_exam_package_versions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  version integer not null check (version > 0),
  package_hash text not null check (package_hash ~ '^[a-f0-9]{64}$'),
  published_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (exam_id, version),
  unique (exam_id, package_hash)
);
alter table public.cbt_exam_package_versions enable row level security;
revoke all on table public.cbt_exam_package_versions from public, anon, authenticated;
grant all on table public.cbt_exam_package_versions to service_role;

create table if not exists public.cbt_sync_receipts (
  attempt_id uuid primary key,
  submission_id uuid not null unique references public.exam_submissions(id) on delete restrict,
  exam_id uuid not null references public.exams(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  exam_version integer not null,
  package_hash text not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  score numeric not null,
  total_points numeric not null,
  received_by uuid not null references auth.users(id),
  received_at timestamptz not null default now()
);
alter table public.cbt_sync_receipts enable row level security;
revoke all on table public.cbt_sync_receipts from public, anon, authenticated;
grant all on table public.cbt_sync_receipts to service_role;

create or replace function public.get_cbt_package_signing_key()
returns text
language sql
stable
security definer
set search_path = public, vault, pg_temp
as $function$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'imagemakers-cbt-package-signing-key'
  limit 1
$function$;
revoke all on function public.get_cbt_package_signing_key() from public, anon, authenticated;
grant execute on function public.get_cbt_package_signing_key() to service_role;

create or replace function public.record_cbt_sync_attempt(
  _attempt_id uuid, _exam_id uuid, _student_id uuid, _exam_version integer,
  _package_hash text, _answers jsonb, _score numeric, _total_points numeric,
  _payload_hash text, _received_by uuid, _submitted_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  existing public.cbt_sync_receipts%rowtype;
  new_submission_id uuid := gen_random_uuid();
begin
  select * into existing from public.cbt_sync_receipts where attempt_id = _attempt_id;
  if found then
    if existing.payload_hash <> _payload_hash then
      raise exception 'Idempotency key payload mismatch';
    end if;
    return jsonb_build_object('duplicate', true, 'submission_id', existing.submission_id, 'score', existing.score, 'total_points', existing.total_points);
  end if;

  begin
    insert into public.exam_submissions (id, exam_id, student_id, answers, score, submitted_at)
    values (new_submission_id, _exam_id, _student_id, coalesce(_answers, '{}'::jsonb), _score, _submitted_at);
    insert into public.cbt_sync_receipts (
      attempt_id, submission_id, exam_id, student_id, exam_version, package_hash,
      payload_hash, score, total_points, received_by
    ) values (
      _attempt_id, new_submission_id, _exam_id, _student_id, _exam_version, _package_hash,
      _payload_hash, _score, _total_points, _received_by
    );
  exception when unique_violation then
    select * into existing from public.cbt_sync_receipts where attempt_id = _attempt_id;
    if found and existing.payload_hash = _payload_hash then
      return jsonb_build_object('duplicate', true, 'submission_id', existing.submission_id, 'score', existing.score, 'total_points', existing.total_points);
    end if;
    raise;
  end;

  return jsonb_build_object('duplicate', false, 'submission_id', new_submission_id, 'score', _score, 'total_points', _total_points);
end;
$function$;
revoke all on function public.record_cbt_sync_attempt(uuid,uuid,uuid,integer,text,jsonb,numeric,numeric,text,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.record_cbt_sync_attempt(uuid,uuid,uuid,integer,text,jsonb,numeric,numeric,text,uuid,timestamptz) to service_role;
