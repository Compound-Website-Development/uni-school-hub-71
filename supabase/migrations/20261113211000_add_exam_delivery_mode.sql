alter table public.exams
  add column if not exists delivery_mode text not null default 'web_practice';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'exams_delivery_mode_check'
      and conrelid = 'public.exams'::regclass
  ) then
    alter table public.exams
      add constraint exams_delivery_mode_check
      check (delivery_mode in ('web_practice','desktop_offline'));
  end if;
end
$$;
