-- Admission number sequencing and attendance edit metadata.
-- Existing valid pupil IDs are preserved. Placeholder/blank IDs are assigned in order.

alter table public.attendance
  add column if not exists edited boolean not null default false,
  add column if not exists updated_by uuid null references auth.users(id),
  add column if not exists updated_at timestamptz null;

create table if not exists public.admission_number_counters (
  admission_year integer primary key,
  last_number integer not null default 0 check (last_number >= 0)
);
alter table public.admission_number_counters enable row level security;
revoke all on public.admission_number_counters from public, anon, authenticated;

create or replace function public.next_imagemakers_admission_number(p_year integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
begin
  insert into public.admission_number_counters(admission_year, last_number)
  values (p_year, 1)
  on conflict (admission_year) do update
    set last_number = public.admission_number_counters.last_number + 1
  returning last_number into next_number;

  return 'IMS/' || p_year::text || '/' || lpad(next_number::text, 3, '0');
end;
$$;
revoke all on function public.next_imagemakers_admission_number(integer) from public, anon, authenticated;

-- Seed counters from already-valid admission numbers, so new pupils never
-- restart a year's sequence at 001 on an existing installation.
insert into public.admission_number_counters(admission_year, last_number)
select
  substring(student_id from '^IMS/([0-9]{4})/')::integer,
  max(split_part(student_id, '/', 3)::integer)
from public.students
where student_id ~ '^IMS/[0-9]{4}/[0-9]{3,}$'
group by substring(student_id from '^IMS/([0-9]{4})/')::integer
on conflict (admission_year) do update
  set last_number = greatest(
    public.admission_number_counters.last_number,
    excluded.last_number
  );

create or replace function public.assign_imagemakers_admission_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admission_year integer;
begin
  if new.student_id is null
     or btrim(new.student_id) = ''
     or lower(new.student_id) like '%pending%' then
    admission_year := coalesce(
      extract(year from new.admission_date)::integer,
      extract(year from current_date)::integer
    );
    new.student_id := public.next_imagemakers_admission_number(admission_year);
  end if;
  return new;
end;
$$;
revoke all on function public.assign_imagemakers_admission_number() from public, anon, authenticated;

drop trigger if exists students_assign_admission_number on public.students;
create trigger students_assign_admission_number
before insert or update of student_id, admission_date on public.students
for each row execute function public.assign_imagemakers_admission_number();

-- Backfill only missing/placeholder identifiers; all existing valid IDs remain unchanged.
do $$
declare
  pupil record;
begin
  for pupil in
    select id
    from public.students
    where student_id is null
       or btrim(student_id) = ''
       or lower(student_id) like '%pending%'
    order by coalesce(admission_date, created_at::date), created_at, id
  loop
    update public.students
    set student_id = null
    where id = pupil.id;
  end loop;
end;
$$;

create unique index if not exists students_student_id_unique_idx
  on public.students(student_id);