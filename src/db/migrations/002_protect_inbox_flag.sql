-- Migration: Protect Inbox flag from being cleared
-- Description: Prevents users from clearing is_inbox via UPDATE, which would
-- bypass the delete policy that protects Inbox projects.

create or replace function public.prevent_inbox_flag_clear()
returns trigger as $$
begin
  if old.is_inbox = true and new.is_inbox = false then
    raise exception 'Cannot clear is_inbox flag on the Inbox project';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger protect_inbox_flag
  before update on public.projects
  for each row
  execute function public.prevent_inbox_flag_clear();
