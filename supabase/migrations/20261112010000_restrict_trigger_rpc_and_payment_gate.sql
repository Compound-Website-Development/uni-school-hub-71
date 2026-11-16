-- Restrict helper and trigger-only SECURITY DEFINER RPC exposure.
-- RLS evaluates admin_flag_ok for authenticated users; anonymous callers do not need it.
revoke all on function public.admin_flag_ok(text) from public, anon;
grant execute on function public.admin_flag_ok(text) to authenticated;

-- These functions are invoked by database triggers, not through the Data API.
revoke all on function public.audit_attendance_edit() from public, anon, authenticated;
revoke all on function public.notify_progression() from public, anon, authenticated;

-- Keep the payment RPC available to signed-in staff, but allow only administrators
-- with finance permission or the configured super-admin role.
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
  if not public.has_role(auth.uid(), 'admin')
     or not public.admin_flag_ok('fees') then
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
