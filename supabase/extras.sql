
create or replace function public.gen_hash(raw text)
returns text language sql security definer set search_path = public as $$
  select crypt(raw, gen_salt('bf'));
$$;

create or replace function public.count_tx(cafe uuid, win text)
returns int language sql security definer set search_path = public as $$
  select count(*)::int from transactions
  where cafe_id = cafe and
    case
      when win = 'day' then created_at > now() - interval '1 day'
      when win = 'week' then created_at > now() - interval '7 days'
      when win = 'month' then created_at > now() - interval '30 days'
      else true
    end;
$$;

revoke all on function public.count_tx(uuid, text) from public;
grant execute on function public.count_tx(uuid, text) to authenticated;

grant execute on function public.award_point(uuid, text) to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;
grant execute on function public.balance_for(uuid) to authenticated;
grant execute on function public.gen_hash(text) to authenticated;
