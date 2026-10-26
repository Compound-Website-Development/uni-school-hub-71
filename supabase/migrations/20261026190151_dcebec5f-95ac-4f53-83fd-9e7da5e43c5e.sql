-- Replace every existing parent access code with a strong, unambiguous random code
-- (three 4-character blocks from a 32-character alphabet, ~60 bits of entropy).
-- Existing short/predictable codes stop working immediately; parents use the new
-- codes printed on re-issued ID cards.
UPDATE public.students
SET parent_code = sub.code
FROM (
  SELECT id,
    (
      SELECT string_agg(
               substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(gen_random_bytes(1), 0) % 32)::int + 1, 1),
               ''
             )
      FROM generate_series(1, 12)
    ) AS code
  FROM public.students
  WHERE parent_code IS NOT NULL
) AS sub
WHERE students.id = sub.id;