-- Preserve every pupil progression decision and update the current class atomically.
create table if not exists public.student_progression_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  previous_class_id uuid references public.classes(id) on delete set null,
  new_class_id uuid references public.classes(id) on delete set null,
  academic_session text not null,
  decision text not null check (decision in ('promoted','repeated','demoted')),
  decision_date date not null default current_date,
  notes text,
  decided_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists student_progression_history_student_date_idx
  on public.student_progression_history(student_id, decision_date desc);

alter table public.student_progression_history enable row level security;

drop policy if exists "Admins manage progression history" on public.student_progression_history;
create policy "Admins manage progression history"
  on public.student_progression_history
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Pupils read own progression history" on public.student_progression_history;
create policy "Pupils read own progression history"
  on public.student_progression_history
  for select to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_progression_history.student_id
      and s.user_id = auth.uid()
  ));

create or replace function public.record_student_progression(
  _student_id uuid,
  _new_class_id uuid,
  _academic_session text,
  _decision text,
  _decision_date date default current_date,
  _notes text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  previous_id uuid;
  history_id uuid;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Administrator access required';
  end if;
  if _decision not in ('promoted','repeated','demoted') then
    raise exception 'Invalid progression decision';
  end if;
  if nullif(trim(_academic_session), '') is null then
    raise exception 'Academic session is required';
  end if;
  select class_id into previous_id
    from public.students
    where id = _student_id and status = 'active'
    for update;
  if not found then
    raise exception 'Active pupil not found';
  end if;
  if _new_class_id is not null and not exists (
    select 1 from public.classes where id = _new_class_id
  ) then
    raise exception 'Selected class does not exist';
  end if;
  if _decision = 'repeated' and previous_id is distinct from _new_class_id then
    raise exception 'A repeated pupil must remain in the same class';
  end if;
  if _decision = 'promoted' and previous_id is not distinct from _new_class_id then
    raise exception 'Choose the next class for a promotion';
  end if;
  update public.students set class_id = _new_class_id, updated_at = now()
    where id = _student_id;
  insert into public.student_progression_history
    (student_id, previous_class_id, new_class_id, academic_session, decision, decision_date, notes, decided_by)
  values
    (_student_id, previous_id, _new_class_id, trim(_academic_session), _decision, coalesce(_decision_date, current_date), nullif(trim(_notes), ''), auth.uid())
  returning id into history_id;
  return history_id;
end;
$function$;

revoke all on function public.record_student_progression(uuid, uuid, text, text, date, text) from public;
grant execute on function public.record_student_progression(uuid, uuid, text, text, date, text) to authenticated;
