
REVOKE EXECUTE ON FUNCTION public.recalc_invoice(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_term_invoices(uuid, uuid, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_manual_payment(uuid, numeric, text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.upsert_student_discount(uuid, uuid, text, numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.debtor_report(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.next_invoice_serial() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.next_receipt_serial() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.generate_term_invoices(uuid, uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_manual_payment(uuid, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_student_discount(uuid, uuid, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debtor_report(uuid) TO authenticated;
GRANT USAGE ON SEQUENCE public.invoice_serial_seq TO authenticated, service_role;
GRANT USAGE ON SEQUENCE public.receipt_serial_seq TO authenticated, service_role;
