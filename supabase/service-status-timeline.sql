-- Riwayat status servis untuk halaman publik cek-servisan.
-- Fungsi hanya mengembalikan riwayat jika nomor tiket dan PIN cocok.

create or replace function public.customer_read_service_timeline(p_ticket text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service jsonb;
  v_history jsonb;
begin
  v_service := public.cc_find_active_service(p_ticket, p_pin);
  if v_service is null then
    return '[]'::jsonb;
  end if;

  v_history := v_service -> 'statusHistory';
  if coalesce(jsonb_typeof(v_history), '') <> 'array' then
    return '[]'::jsonb;
  end if;
  return v_history;
end;
$$;

revoke all on function public.customer_read_service_timeline(text, text) from public;
grant execute on function public.customer_read_service_timeline(text, text) to anon, authenticated;
