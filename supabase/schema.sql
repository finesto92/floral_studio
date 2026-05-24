create table if not exists public.floral_products (
  id text primary key,
  name text not null,
  description text not null default '',
  image_url text not null default '',
  min_budget integer not null default 0,
  budgets integer[] not null default '{}',
  pickup boolean not null default true,
  delivery boolean not null default true,
  available boolean not null default true,
  visible boolean not null default true,
  images text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.floral_delivery_areas (
  id text primary key,
  name text not null,
  fee numeric,
  fee_label text not null default '퀵배송비 별도',
  available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.floral_customers (
  id text primary key,
  customer_key text not null unique,
  name text not null,
  phone text not null,
  memo text not null default '',
  tags text[] not null default '{}',
  order_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.floral_orders (
  id text primary key,
  number text not null unique,
  status text not null default '접수',
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  category text not null,
  category_id text not null,
  budget integer not null default 0,
  color text not null default '',
  mood text not null default '',
  occasion text not null default '',
  card_message text not null default '',
  reference_image_name text not null default '',
  fulfillment text not null default 'pickup',
  receive_date date not null,
  receive_time text not null,
  delivery_area text not null default '',
  delivery_fee numeric not null default 0,
  delivery_fee_label text not null default '',
  delivery_address text not null default '',
  delivery_detail text not null default '',
  delivery_request text not null default '',
  customer_name text not null,
  customer_phone text not null,
  recipient_name text not null default '',
  recipient_phone text not null default '',
  request_note text not null default '',
  order_memo text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.floral_notifications (
  id text primary key,
  target text not null,
  message text not null,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

alter table public.floral_products enable row level security;
alter table public.floral_delivery_areas enable row level security;
alter table public.floral_customers enable row level security;
alter table public.floral_orders enable row level security;
alter table public.floral_notifications enable row level security;

grant usage on schema public to service_role;
grant all on table public.floral_products to service_role;
grant all on table public.floral_delivery_areas to service_role;
grant all on table public.floral_customers to service_role;
grant all on table public.floral_orders to service_role;
grant all on table public.floral_notifications to service_role;

insert into public.floral_products
  (id, name, description, image_url, min_budget, budgets, pickup, delivery, available, visible, images)
values
  ('bouquet', '꽃다발', '개인 선물과 기념일에 적합합니다.', 'assets/bouquet-photo.jpg', 30000, array[30000, 50000, 70000, 100000], true, true, true, true, array['핑크톤 예시', '화이트톤 예시']),
  ('basket', '꽃바구니', '풍성한 선물과 행사에 적합합니다.', 'assets/basket-photo.jpg', 50000, array[50000, 70000, 100000, 150000], true, true, true, true, array['화사한 예시', '고급스러운 예시']),
  ('plant', '화분', '개업, 집들이, 사무실 선물에 적합합니다.', 'assets/plant-photo.jpg', 50000, array[50000, 70000, 100000, 150000], true, true, true, true, array['관엽 예시', '테이블 화분 예시']),
  ('custom', '맞춤주문', '참고 사진과 요청사항을 바탕으로 상담합니다.', 'assets/custom-photo.jpg', 0, array[0], true, true, true, true, array['상담 주문'])
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  min_budget = excluded.min_budget,
  budgets = excluded.budgets,
  pickup = excluded.pickup,
  delivery = excluded.delivery,
  available = excluded.available,
  visible = excluded.visible,
  images = excluded.images,
  updated_at = now();

insert into public.floral_delivery_areas
  (id, name, fee, fee_label, available)
values
  ('ilsan-dong', '고양시 일산동구', null, '퀵배송비 별도', true),
  ('ilsan-seo', '고양시 일산서구', null, '퀵배송비 별도', true),
  ('other', '일산 외 지역', null, '배송 상담 필요', false)
on conflict (id) do update set
  name = excluded.name,
  fee = excluded.fee,
  fee_label = excluded.fee_label,
  available = excluded.available,
  updated_at = now();
