-- Run this whole file once in Supabase: Dashboard > SQL Editor > New query > Run.

create table if not exists products (
  id         bigint generated always as identity primary key,
  n          text    not null,
  c          text    not null check (c in ('Cameras','PSP','iPods','Vintage')),
  p          integer not null check (p >= 0),
  s          integer not null check (s >= 0),
  d          text    not null default '',
  i          text    not null default '',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id     bigint generated always as identity (start with 10001) primary key,
  date   timestamptz not null default now(),
  name   text    not null,
  phone  text    not null,
  wilaya text    not null,
  addr   text    not null default '',
  items  jsonb   not null,
  total  integer not null,
  st     text    not null default 'New'
         check (st in ('New','Confirmed','Shipped','Delivered','Cancelled'))
);

create table if not exists settings (
  id int primary key check (id = 1),
  wa text not null,
  ig text not null
);

-- Lock the tables down: only the server (service role key) can touch them.
-- No policies = the public anon key gets nothing.
alter table products enable row level security;
alter table orders   enable row level security;
alter table settings enable row level security;

-- Place an order atomically: checks stock, takes prices from the DB, decrements stock.
create or replace function place_order(
  p_name text, p_phone text, p_wilaya text, p_addr text, p_items jsonb
) returns orders
language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  prod products;
  qty int;
  line jsonb := '[]'::jsonb;
  sum int := 0;
  o orders;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    qty := (it->>'q')::int;
    select * into prod from products where id = (it->>'id')::bigint for update;
    if not found then
      raise exception 'A product in your cart no longer exists.';
    end if;
    if qty is null or qty < 1 or qty > 10 then
      raise exception 'Invalid quantity.';
    end if;
    if prod.s < qty then
      raise exception 'Not enough stock for "%" (% left).', prod.n, prod.s;
    end if;
    update products set s = s - qty where id = prod.id;
    line := line || jsonb_build_object('id', prod.id, 'n', prod.n, 'q', qty, 'p', prod.p);
    sum := sum + prod.p * qty;
  end loop;

  insert into orders (name, phone, wilaya, addr, items, total)
  values (p_name, p_phone, p_wilaya, p_addr, line, sum)
  returning * into o;
  return o;
end $$;

-- Change an order status; cancelling returns stock, reopening takes it again.
create or replace function set_order_status(p_id bigint, p_st text)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  o orders;
  it jsonb;
  prod products;
begin
  select * into o from orders where id = p_id for update;
  if not found then raise exception 'Order not found'; end if;

  if o.st <> 'Cancelled' and p_st = 'Cancelled' then
    for it in select * from jsonb_array_elements(o.items) loop
      update products set s = s + (it->>'q')::int where id = (it->>'id')::bigint;
    end loop;
  elsif o.st = 'Cancelled' and p_st <> 'Cancelled' then
    for it in select * from jsonb_array_elements(o.items) loop
      select * into prod from products where id = (it->>'id')::bigint for update;
      if found and prod.s < (it->>'q')::int then
        raise exception 'Not enough stock to reopen: "%"', it->>'n';
      end if;
    end loop;
    for it in select * from jsonb_array_elements(o.items) loop
      update products set s = s - (it->>'q')::int where id = (it->>'id')::bigint;
    end loop;
  end if;

  update orders set st = p_st where id = p_id returning * into o;
  return o;
end $$;

-- Only the server may call these.
revoke all on function place_order(text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function set_order_status(bigint,text)          from public, anon, authenticated;
grant execute on function place_order(text,text,text,text,jsonb) to service_role;
grant execute on function set_order_status(bigint,text)          to service_role;

-- Starter data (delete or edit later from the dashboard).
insert into settings (id, wa, ig) values (1, '213000000000', 'zilla.store')
on conflict (id) do nothing;

insert into products (n, c, p, s, d)
select * from (values
  ('Canon IXUS 130 Digital Camera','Cameras',18000,3,'14MP compact, tested, with charger'),
  ('Sony Cyber-shot DSC-W310','Cameras',15000,2,'12MP, Y2K look'),
  ('Sony PSP 3000 Piano Black','PSP',22000,4,'Modded, 32GB card, 10 games'),
  ('Sony PSP Street E1000','PSP',17000,1,'Clean condition, new battery'),
  ('iPod Classic 7th Gen 160GB','iPods',25000,2,'Fresh battery, silver'),
  ('iPod Nano 6th Gen','iPods',9000,5,'Touch screen, multiple colors'),
  ('Walkman Cassette Player','Vintage',7500,2,'Working, vintage vibes'),
  ('Vintage Handheld Console','Vintage',6000,0,'Sold out, restock soon')
) as v(n,c,p,s,d)
where not exists (select 1 from products);
