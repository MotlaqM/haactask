-- Atomic reorder of projects within a single transaction.
-- Accepts a JSON array of {id, position} objects and applies all updates
-- atomically with row locking to prevent concurrent interleaving.

create or replace function public.reorder_projects(updates jsonb)
returns void
language plpgsql
security definer
as $$
declare
  item jsonb;
  expected_count int;
  actual_count int;
begin
  expected_count := jsonb_array_length(updates);

  -- Verify all projects exist and belong to the calling user (with row lock)
  select count(*) into actual_count
  from public.projects
  where id in (select (u->>'id')::uuid from jsonb_array_elements(updates) as u)
    and user_id = auth.uid()
  for update;

  if actual_count != expected_count then
    raise exception 'One or more projects not found or not owned by user';
  end if;

  -- Apply all position updates
  for item in select * from jsonb_array_elements(updates)
  loop
    update public.projects
    set position = (item->>'position')::int
    where id = (item->>'id')::uuid
      and user_id = auth.uid();
  end loop;
end;
$$;
