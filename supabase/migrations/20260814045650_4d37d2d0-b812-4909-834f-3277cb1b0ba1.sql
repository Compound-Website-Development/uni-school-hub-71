
-- ============ INVOICES ============
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial text NOT NULL UNIQUE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_total numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid',
  due_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, term_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_view" ON public.invoices FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));
CREATE POLICY "invoices_manage" ON public.invoices FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'can_manage_fees'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'can_manage_fees'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVOICE LINES ============
CREATE TABLE public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  fee_item_id uuid REFERENCES public.fee_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'fee',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_lines TO authenticated;
GRANT ALL ON public.invoice_lines TO service_role;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_lines_view" ON public.invoice_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.can_view_student(i.student_id)));
CREATE POLICY "invoice_lines_manage" ON public.invoice_lines FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'can_manage_fees'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'can_manage_fees'));

-- ============ DISCOUNTS ============
CREATE TABLE public.student_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE CASCADE,
  discount_type text NOT NULL DEFAULT 'fixed',
  value numeric NOT NULL DEFAULT 0,
  reason text,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_discounts TO authenticated;
GRANT ALL ON public.student_discounts TO service_role;
ALTER TABLE public.student_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discounts_view" ON public.student_discounts FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));
CREATE POLICY "discounts_manage" ON public.student_discounts FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'can_manage_fees'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'can_manage_fees'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.student_discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RECEIPTS ============
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial text NOT NULL UNIQUE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash',
  reference text,
  note text,
  issued_by uuid,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts_view" ON public.receipts FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));
CREATE POLICY "receipts_manage" ON public.receipts FOR ALL TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'can_manage_fees'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'can_manage_fees'));

-- ============ FINANCE AUDIT ============
CREATE TABLE public.finance_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.finance_audit TO authenticated;
GRANT ALL ON public.finance_audit TO service_role;
ALTER TABLE public.finance_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_audit_view" ON public.finance_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "finance_audit_insert" ON public.finance_audit FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ MESSAGE TEMPLATES ============
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  channel text NOT NULL DEFAULT 'sms',
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_view" ON public.message_templates FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "templates_manage" ON public.message_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ POLICY DOCUMENTS ============
CREATE TABLE public.policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'finance',
  version text NOT NULL DEFAULT 'v1',
  description text,
  storage_path text,
  is_published boolean NOT NULL DEFAULT true,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.policy_documents TO authenticated;
GRANT ALL ON public.policy_documents TO service_role;
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policies_view" ON public.policy_documents FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "policies_manage" ON public.policy_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.policy_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SERIALS ============
CREATE SEQUENCE IF NOT EXISTS public.invoice_serial_seq;
CREATE SEQUENCE IF NOT EXISTS public.receipt_serial_seq;

CREATE OR REPLACE FUNCTION public.next_invoice_serial()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'IMS/INV/' || to_char(now(), 'YYYY') || '/' || lpad(nextval('public.invoice_serial_seq')::text, 5, '0')
$$;

CREATE OR REPLACE FUNCTION public.next_receipt_serial()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'IMS/RCP/' || to_char(now(), 'YYYY') || '/' || lpad(nextval('public.receipt_serial_seq')::text, 5, '0')
$$;

-- ============ INVOICE TOTALS RECALC ============
CREATE OR REPLACE FUNCTION public.recalc_invoice(_invoice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.invoices%ROWTYPE;
  fees numeric := 0;
  disc numeric := 0;
  paid numeric := 0;
BEGIN
  SELECT * INTO inv FROM public.invoices WHERE id = _invoice_id;
  IF inv.id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(sum(amount), 0) INTO fees
    FROM public.invoice_lines WHERE invoice_id = _invoice_id AND kind = 'fee';

  SELECT COALESCE(sum(CASE WHEN d.discount_type = 'percentage' THEN fees * d.value / 100 ELSE d.value END), 0)
    INTO disc
    FROM public.student_discounts d
   WHERE d.student_id = inv.student_id
     AND (d.term_id = inv.term_id OR d.term_id IS NULL);

  IF disc > fees THEN disc := fees; END IF;

  SELECT COALESCE(sum(amount), 0) INTO paid FROM public.receipts WHERE invoice_id = _invoice_id;

  UPDATE public.invoices
     SET subtotal = fees,
         discount_total = disc,
         total = fees - disc,
         amount_paid = paid,
         status = CASE WHEN paid >= (fees - disc) AND (fees - disc) > 0 THEN 'paid'
                       WHEN paid > 0 THEN 'part_paid'
                       ELSE 'unpaid' END,
         updated_at = now()
   WHERE id = _invoice_id;
END; $$;

-- ============ GENERATE TERM INVOICES ============
CREATE OR REPLACE FUNCTION public.generate_term_invoices(_term_id uuid, _class_id uuid DEFAULT NULL, _due_date date DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s record;
  inv_id uuid;
  created integer := 0;
BEGIN
  IF NOT public.has_admin_permission(auth.uid(), 'can_manage_fees') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  FOR s IN SELECT id, class_id FROM public.students
            WHERE status = 'active' AND class_id IS NOT NULL
              AND (_class_id IS NULL OR class_id = _class_id)
  LOOP
    SELECT id INTO inv_id FROM public.invoices WHERE student_id = s.id AND term_id = _term_id;
    IF inv_id IS NULL THEN
      INSERT INTO public.invoices (serial, student_id, term_id, class_id, due_date, created_by)
      VALUES (public.next_invoice_serial(), s.id, _term_id, s.class_id, _due_date, auth.uid())
      RETURNING id INTO inv_id;
      created := created + 1;
    END IF;

    DELETE FROM public.invoice_lines WHERE invoice_id = inv_id AND kind = 'fee';
    INSERT INTO public.invoice_lines (invoice_id, fee_item_id, description, amount, kind)
    SELECT inv_id, f.id, f.name, f.amount, 'fee'
      FROM public.fee_items f
     WHERE (f.class_id = s.class_id OR f.class_id IS NULL)
       AND (f.term_id = _term_id OR f.term_id IS NULL);

    PERFORM public.recalc_invoice(inv_id);
  END LOOP;

  INSERT INTO public.finance_audit (actor_id, action, entity, entity_id, after_data)
  VALUES (auth.uid(), 'generate_invoices', 'invoices', _term_id::text,
          jsonb_build_object('created', created, 'class_id', _class_id));

  RETURN created;
END; $$;

-- ============ RECORD MANUAL PAYMENT ============
CREATE OR REPLACE FUNCTION public.record_manual_payment(
  _invoice_id uuid, _amount numeric, _method text DEFAULT 'cash',
  _reference text DEFAULT NULL, _note text DEFAULT NULL)
RETURNS public.receipts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.invoices%ROWTYPE;
  rec public.receipts%ROWTYPE;
BEGIN
  IF NOT public.has_admin_permission(auth.uid(), 'can_manage_fees') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  SELECT * INTO inv FROM public.invoices WHERE id = _invoice_id;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'Invoice not found'; END IF;

  INSERT INTO public.receipts (serial, invoice_id, student_id, amount, method, reference, note, issued_by)
  VALUES (public.next_receipt_serial(), inv.id, inv.student_id, _amount, COALESCE(_method,'cash'), _reference, _note, auth.uid())
  RETURNING * INTO rec;

  PERFORM public.recalc_invoice(inv.id);

  INSERT INTO public.finance_audit (actor_id, action, entity, entity_id, before_data, after_data)
  VALUES (auth.uid(), 'record_payment', 'receipts', rec.id::text,
          jsonb_build_object('amount_paid', inv.amount_paid, 'status', inv.status),
          jsonb_build_object('amount', _amount, 'method', _method, 'serial', rec.serial));

  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT l.parent_user_id, 'Payment received',
         'A payment of ₦' || to_char(_amount, 'FM999,999,999') || ' has been recorded. Receipt ' || rec.serial,
         'finance', '/parent/fees'
    FROM public.parent_student_links l
   WHERE l.student_id = inv.student_id;

  RETURN rec;
END; $$;

-- ============ SET DISCOUNT ============
CREATE OR REPLACE FUNCTION public.upsert_student_discount(
  _student_id uuid, _term_id uuid, _discount_type text, _value numeric, _reason text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d_id uuid; inv_id uuid;
BEGIN
  IF NOT public.has_admin_permission(auth.uid(), 'can_manage_fees') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  INSERT INTO public.student_discounts (student_id, term_id, discount_type, value, reason, approved_by)
  VALUES (_student_id, _term_id, COALESCE(_discount_type,'fixed'), COALESCE(_value,0), _reason, auth.uid())
  RETURNING id INTO d_id;

  INSERT INTO public.finance_audit (actor_id, action, entity, entity_id, after_data)
  VALUES (auth.uid(), 'set_discount', 'student_discounts', d_id::text,
          jsonb_build_object('student_id', _student_id, 'type', _discount_type, 'value', _value, 'reason', _reason));

  FOR inv_id IN SELECT id FROM public.invoices WHERE student_id = _student_id AND (term_id = _term_id OR _term_id IS NULL) LOOP
    PERFORM public.recalc_invoice(inv_id);
  END LOOP;

  RETURN d_id;
END; $$;

-- ============ DEBTOR REPORT ============
CREATE OR REPLACE FUNCTION public.debtor_report(_term_id uuid DEFAULT NULL)
RETURNS TABLE(invoice_id uuid, serial text, student_id uuid, student_name text, admission_no text,
              class_name text, total numeric, amount_paid numeric, balance numeric, status text, due_date date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.serial, s.id,
         trim(concat_ws(' ', s.first_name, s.last_name)), s.student_id,
         c.name, i.total, i.amount_paid, i.total - i.amount_paid, i.status, i.due_date
    FROM public.invoices i
    JOIN public.students s ON s.id = i.student_id
    LEFT JOIN public.classes c ON c.id = i.class_id
   WHERE public.has_admin_permission(auth.uid(), 'can_manage_fees')
     AND (_term_id IS NULL OR i.term_id = _term_id)
     AND i.total - i.amount_paid > 0
   ORDER BY (i.total - i.amount_paid) DESC
$$;

-- ============ DEFAULT TEMPLATES ============
INSERT INTO public.message_templates (key, channel, name, subject, body) VALUES
 ('fee_reminder', 'sms', 'Fee reminder (SMS)', NULL,
  'Dear {{parent_name}}, the school fees for {{student_name}} ({{term}}) show an outstanding balance of {{balance}}. Kindly settle before {{due_date}}. - Imagemakers Nursery and Primary School'),
 ('fee_reminder', 'email', 'Fee reminder (Email)', 'Outstanding school fees for {{student_name}}',
  'Dear {{parent_name}},<br/><br/>Our records show an outstanding balance of <b>{{balance}}</b> on the {{term}} invoice for {{student_name}} ({{class_name}}). Kindly settle on or before {{due_date}}.<br/><br/>Thank you,<br/>Imagemakers Nursery and Primary School'),
 ('attendance_alert', 'sms', 'Attendance alert (SMS)', NULL,
  'Dear {{parent_name}}, {{student_name}} was marked absent on {{date}}. Please contact the school office. - Imagemakers'),
 ('announcement', 'email', 'General announcement (Email)', '{{title}}',
  'Dear {{parent_name}},<br/><br/>{{body}}<br/><br/>Imagemakers Nursery and Primary School')
ON CONFLICT (key, channel) DO NOTHING;
