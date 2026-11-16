-- Fail closed: an admin without an explicit permission row is not a super-admin
-- and does not inherit every permission.
create or replace function public.has_admin_permission(_user_id uuid, _permission text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if not public.has_role(_user_id, 'admin') then
    return false;
  end if;

  execute format('select %I from public.admin_permissions where user_id = $1', _permission)
    into allowed using _user_id;

  return coalesce(allowed, false);
end;
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_user_id, 'admin')
    and coalesce(
      (select p.can_add_admins from public.admin_permissions p where p.user_id = _user_id),
      false
    );
$$;

create or replace function public.admin_flag_ok(_flag text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.has_role(auth.uid(), 'admin') then true
    when public.is_super_admin(auth.uid()) then true
    when _flag = 'fees' then public.has_admin_permission(auth.uid(), 'can_manage_fees')
    when _flag = 'academic_view' then
      public.has_admin_permission(auth.uid(), 'can_view_reports')
      or public.has_admin_permission(auth.uid(), 'can_approve_grades')
    when _flag = 'academic_manage' then
      public.has_admin_permission(auth.uid(), 'can_approve_grades')
    else false
  end;
$$;

-- Finance: preserve parent/staff scoped policies but limit admin visibility and
-- writes to the Proprietor or an administrator explicitly granted fee access.
do $$
declare target_table text;
begin
  foreach target_table in array array[
    'invoices', 'invoice_lines', 'receipts', 'receipt_allocations',
    'fee_payments', 'student_discounts', 'finance_audit', 'payment_proofs'
  ] loop
    execute format('drop policy if exists "finance_role_gate" on public.%I', target_table);
    execute format(
      'create policy "finance_role_gate" on public.%I as restrictive for all to authenticated using (public.admin_flag_ok(''fees'')) with check (public.admin_flag_ok(''fees''))',
      target_table
    );
  end loop;
end
$$;

-- Academic reads and changes are separately gated for admins.
-- Existing teacher, pupil and linked-parent policies remain in force.
do $$
declare target_table text;
begin
  foreach target_table in array array['grades', 'term_results'] loop
    execute format('drop policy if exists "academic_role_gate" on public.%I', target_table);
    execute format('drop policy if exists "academic_view_role_gate" on public.%I', target_table);
    execute format('drop policy if exists "academic_insert_role_gate" on public.%I', target_table);
    execute format('drop policy if exists "academic_update_role_gate" on public.%I', target_table);
    execute format('drop policy if exists "academic_delete_role_gate" on public.%I', target_table);

    execute format(
      'create policy "academic_view_role_gate" on public.%I as restrictive for select to authenticated using (public.admin_flag_ok(''academic_view''))',
      target_table
    );
    execute format(
      'create policy "academic_insert_role_gate" on public.%I as restrictive for insert to authenticated with check (public.admin_flag_ok(''academic_manage''))',
      target_table
    );
    execute format(
      'create policy "academic_update_role_gate" on public.%I as restrictive for update to authenticated using (public.admin_flag_ok(''academic_manage'')) with check (public.admin_flag_ok(''academic_manage''))',
      target_table
    );
    execute format(
      'create policy "academic_delete_role_gate" on public.%I as restrictive for delete to authenticated using (public.admin_flag_ok(''academic_manage''))',
      target_table
    );
  end loop;
end
$$;

-- Retire the unapproved A-F grade. Keep the legacy column only for backwards
-- compatibility with older clients; new and updated grades store NULL there.
create or replace function public.clear_letter_grade()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.letter_grade := null;
  return new;
end;
$$;

drop trigger if exists zz_clear_letter_grade on public.grades;
create trigger zz_clear_letter_grade
before insert or update on public.grades
for each row execute function public.clear_letter_grade();

update public.grades set letter_grade = null where letter_grade is not null;

-- Parents can read only progression history for pupils explicitly linked to them.
drop policy if exists "Parents read linked child progression" on public.student_progression_history;
create policy "Parents read linked child progression"
on public.student_progression_history
for select to authenticated
using (
  exists (
    select 1
    from public.parent_student_links l
    where l.student_id = student_progression_history.student_id
      and l.parent_user_id = auth.uid()
  )
);

-- Notify the pupil and all linked parents when a class decision is recorded.
create or replace function public.notify_progression()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  class_name text;
  decision_text text;
begin
  select c.name into class_name
  from public.classes c
  where c.id = new.new_class_id;

  decision_text := 'The school recorded ' || new.decision
    || coalesce(' for class ' || class_name, '')
    || ' in ' || new.academic_session || '.';

  insert into public.notifications(user_id, title, body, type, link)
  select s.user_id, 'Class decision recorded', decision_text, 'progression', '/student/grades'
  from public.students s
  where s.id = new.student_id and s.user_id is not null;

  insert into public.notifications(user_id, title, body, type, link)
  select distinct l.parent_user_id, 'Class decision recorded', decision_text, 'progression', '/parent/grades'
  from public.parent_student_links l
  where l.student_id = new.student_id and l.parent_user_id is not null;

  return new;
end;
$$;

drop trigger if exists trg_notify_progression on public.student_progression_history;
create trigger trg_notify_progression
after insert on public.student_progression_history
for each row execute function public.notify_progression();

-- One payment reference may be used only once (case- and whitespace-insensitive).
create unique index if not exists receipts_reference_unique
on public.receipts (lower(btrim(reference)))
where reference is not null and btrim(reference) <> '';

create or replace function public.record_manual_payment(
  _invoice_id uuid,
  _amount numeric,
  _method text default 'cash',
  _reference text default null,
  _note text default null
)
returns public.receipts
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invoices%rowtype;
  rec public.receipts%rowtype;
begin
  if not public.has_admin_permission(auth.uid(), 'can_manage_fees') then
    raise exception 'Not allowed';
  end if;
  if _amount is null or _amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if nullif(btrim(coalesce(_reference, '')), '') is not null
    and exists (
      select 1 from public.receipts r
      where lower(btrim(r.reference)) = lower(btrim(_reference))
    ) then
    raise exception 'This payment reference has already been used.';
  end if;

  select * into inv from public.invoices where id = _invoice_id;
  if inv.id is null then
    raise exception 'Invoice not found';
  end if;

  insert into public.receipts (
    serial, invoice_id, student_id, amount, method, reference, note, issued_by
  )
  values (
    public.next_receipt_serial(), inv.id, inv.student_id, _amount,
    coalesce(_method, 'cash'), nullif(btrim(_reference), ''), _note, auth.uid()
  )
  returning * into rec;

  perform public.recalc_invoice(inv.id);

  insert into public.finance_audit (
    actor_id, action, entity, entity_id, before_data, after_data
  )
  values (
    auth.uid(), 'record_payment', 'receipts', rec.id::text,
    jsonb_build_object('amount_paid', inv.amount_paid, 'status', inv.status),
    jsonb_build_object('amount', _amount, 'method', _method, 'serial', rec.serial)
  );

  insert into public.notifications(user_id, title, body, type, link)
  select l.parent_user_id, 'Payment received',
    'A payment of ₦' || to_char(_amount, 'FM999,999,999')
      || ' has been recorded. Receipt ' || rec.serial,
    'finance', '/parent/fees'
  from public.parent_student_links l
  where l.student_id = inv.student_id;

  return rec;
end;
$$;

-- Synchronize the sequential admission counter with numbers already issued.
create table if not exists public.admission_number_counters (
  admission_year integer primary key,
  last_number integer not null default 0 check (last_number >= 0)
);
alter table public.admission_number_counters enable row level security;
revoke all on public.admission_number_counters from public, anon, authenticated;

insert into public.admission_number_counters(admission_year, last_number)
select
  substring(student_id from '^IMS/([0-9]{4})/')::integer,
  max(split_part(student_id, '/', 3)::integer)
from public.students
where student_id ~ '^IMS/[0-9]{4}/[0-9]{3,}$'
group by substring(student_id from '^IMS/([0-9]{4})/')::integer
on conflict (admission_year) do update
set last_number = greatest(public.admission_number_counters.last_number, excluded.last_number);

-- Attendance edits keep the original record and create an audit entry.
alter table public.attendance
  add column if not exists edited boolean not null default false,
  add column if not exists updated_by uuid null references auth.users(id),
  add column if not exists updated_at timestamptz null;

create or replace function public.audit_attendance_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.activity_logs(user_id, action, entity, entity_id, details)
    values (
      coalesce(auth.uid(), new.updated_by),
      'attendance_edited',
      'attendance',
      new.id::text,
      jsonb_build_object(
        'student_id', new.student_id,
        'class_id', new.class_id,
        'date', new.date,
        'previous_status', old.status,
        'new_status', new.status,
        'edited_at', coalesce(new.updated_at, now())
      )::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_attendance_edit on public.attendance;
create trigger trg_audit_attendance_edit
after update of status on public.attendance
for each row execute function public.audit_attendance_edit();
