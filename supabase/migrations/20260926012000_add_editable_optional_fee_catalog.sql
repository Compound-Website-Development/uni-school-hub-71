-- Editable fee catalogue and per-pupil optional fee selections
ALTER TABLE public.fee_items
  ADD COLUMN IF NOT EXISTS is_mandatory boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

CREATE TABLE IF NOT EXISTS public.student_fee_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_item_id uuid NOT NULL REFERENCES public.fee_items(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE CASCADE,
  selected_at timestamptz NOT NULL DEFAULT now(),
  selected_by uuid,
  UNIQUE (student_id, fee_item_id, term_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_fee_selections TO authenticated;
GRANT ALL ON public.student_fee_selections TO service_role;
ALTER TABLE public.student_fee_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_fee_selections_view" ON public.student_fee_selections FOR SELECT TO authenticated
USING (public.can_view_student(student_id));

CREATE POLICY "student_fee_selections_manage" ON public.student_fee_selections FOR ALL TO authenticated
USING (public.has_admin_permission(auth.uid(), 'can_manage_fees'))
WITH CHECK (public.has_admin_permission(auth.uid(), 'can_manage_fees'));

CREATE INDEX IF NOT EXISTS student_fee_selections_student_term_idx
ON public.student_fee_selections(student_id, term_id);

CREATE INDEX IF NOT EXISTS fee_items_category_active_idx
ON public.fee_items(category, is_active);

INSERT INTO public.fee_items (name, amount, category, is_mandatory, is_active)
SELECT v.name, v.amount, v.category, v.is_mandatory, true
FROM (VALUES
  ('Monday/Tuesday Uniform Pair', 26500::numeric, 'uniform', true),
  ('Wednesday Wear', 10000::numeric, 'uniform', true),
  ('Friday Wear', 10000::numeric, 'uniform', true),
  ('Taekwondo', 18000::numeric, 'club', false),
  ('Red Cross', 12000::numeric, 'club', false),
  ('Cub Scout', 18000::numeric, 'club', false),
  ('Brownie', 12000::numeric, 'club', false),
  ('Textbook Fee', 0::numeric, 'textbook', false)
) AS v(name, amount, category, is_mandatory)
WHERE NOT EXISTS (SELECT 1 FROM public.fee_items f WHERE f.name = v.name);

-- Invoice generation now includes mandatory active fees plus only the optional fees
-- explicitly selected for the pupil and term.
CREATE OR REPLACE FUNCTION public.generate_term_invoices(
  _term_id uuid, _class_id uuid DEFAULT NULL, _due_date date DEFAULT NULL
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; inv_id uuid; created integer := 0;
BEGIN
  IF NOT public.has_admin_permission(auth.uid(), 'can_manage_fees') THEN RAISE EXCEPTION 'Not allowed'; END IF;

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
    WHERE f.is_active = true
      AND (f.class_id = s.class_id OR f.class_id IS NULL)
      AND (f.term_id = _term_id OR f.term_id IS NULL)
      AND (
        f.is_mandatory = true
        OR EXISTS (
          SELECT 1 FROM public.student_fee_selections sel
          WHERE sel.student_id = s.id
            AND sel.fee_item_id = f.id
            AND (sel.term_id = _term_id OR sel.term_id IS NULL)
        )
      );

    PERFORM public.recalc_invoice(inv_id);
  END LOOP;

  INSERT INTO public.finance_audit (actor_id, action, entity, entity_id, after_data)
  VALUES (auth.uid(), 'generate_invoices', 'invoices', _term_id::text,
          jsonb_build_object('created', created, 'class_id', _class_id));
  RETURN created;
END; $$;
