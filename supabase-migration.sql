-- Run this once in Supabase Dashboard → SQL Editor.
-- Idempotent: safe to re-run.

-- =========================================================
-- helper: is user a member of a hike (organizer or accepted)
-- =========================================================
create or replace function public.is_hike_member(_hike_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from hikes where id = _hike_id and organizer_id = _user_id
  ) or exists (
    select 1 from hike_participants
    where hike_id = _hike_id and user_id = _user_id and status = 'accepted'
  );
$$;

-- =========================================================
-- RLS — hike_participants
-- =========================================================
alter table public.hike_participants enable row level security;

drop policy if exists "hp_select_self_or_organizer" on public.hike_participants;
create policy "hp_select_self_or_organizer"
on public.hike_participants for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from hikes h where h.id = hike_id and h.organizer_id = auth.uid()
  )
);

drop policy if exists "hp_insert_self" on public.hike_participants;
create policy "hp_insert_self"
on public.hike_participants for insert
with check (user_id = auth.uid());

drop policy if exists "hp_update_organizer_or_self_cancel" on public.hike_participants;
create policy "hp_update_organizer_or_self_cancel"
on public.hike_participants for update
using (
  exists (select 1 from hikes h where h.id = hike_id and h.organizer_id = auth.uid())
  or user_id = auth.uid()
);

drop policy if exists "hp_delete_self" on public.hike_participants;
create policy "hp_delete_self"
on public.hike_participants for delete
using (user_id = auth.uid());

-- =========================================================
-- RLS — messages
-- =========================================================
alter table public.messages enable row level security;

drop policy if exists "msg_select_members" on public.messages;
create policy "msg_select_members"
on public.messages for select
using (public.is_hike_member(hike_id, auth.uid()));

drop policy if exists "msg_insert_members" on public.messages;
create policy "msg_insert_members"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and public.is_hike_member(hike_id, auth.uid())
);

-- =========================================================
-- RLS — notifications
-- =========================================================
alter table public.notifications enable row level security;

drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own"
on public.notifications for select
using (user_id = auth.uid());

drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own"
on public.notifications for update
using (user_id = auth.uid());

-- =========================================================
-- Triggers
-- =========================================================

-- Notify organizer on new join request
create or replace function public.notify_join_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  org uuid; ttl text;
begin
  select organizer_id, title into org, ttl from hikes where id = new.hike_id;
  if org is not null and org <> new.user_id and new.status = 'pending' then
    insert into notifications(user_id, type, payload)
    values (org, 'join_request',
      jsonb_build_object(
        'hike_id', new.hike_id,
        'hike_title', ttl,
        'participant_id', new.id,
        'requester_id', new.user_id
      ));
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_join_request on public.hike_participants;
create trigger trg_notify_join_request
after insert on public.hike_participants
for each row execute function public.notify_join_request();

-- Notify requester on accept/decline
create or replace function public.notify_request_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare ttl text;
begin
  if new.status <> old.status and new.status in ('accepted','declined') then
    select title into ttl from hikes where id = new.hike_id;
    insert into notifications(user_id, type, payload)
    values (new.user_id,
      case when new.status='accepted' then 'request_accepted' else 'request_declined' end,
      jsonb_build_object('hike_id', new.hike_id, 'hike_title', ttl));
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_request_status on public.hike_participants;
create trigger trg_notify_request_status
after update on public.hike_participants
for each row execute function public.notify_request_status();

-- Notify hike members on new message
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare ttl text;
begin
  select title into ttl from hikes where id = new.hike_id;
  insert into notifications(user_id, type, payload)
  select uid, 'new_message',
    jsonb_build_object('hike_id', new.hike_id, 'hike_title', ttl, 'sender_id', new.sender_id)
  from (
    select organizer_id as uid from hikes where id = new.hike_id
    union
    select user_id from hike_participants where hike_id = new.hike_id and status='accepted'
  ) t
  where uid <> new.sender_id;
  return new;
end $$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
after insert on public.messages
for each row execute function public.notify_new_message();

-- =========================================================
-- Realtime
-- =========================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.hike_participants;
