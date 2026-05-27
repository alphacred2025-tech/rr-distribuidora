-- ================================================================
-- RR Distribuidora — Schema Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- ================================================================

-- ── Extensões ────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ================================================================
-- TABELAS
-- ================================================================

-- Perfis dos usuários internos (espelha auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  email      text,
  papel      text not null default 'vendedor'
               check (papel in ('admin','vendedor','logistica','financeiro')),
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

-- Clientes do site
create table if not exists public.clientes (
  id         uuid primary key default uuid_generate_v4(),
  nome       text not null,
  telefone   text,
  email      text,
  cpf        text,
  origem     text default 'site',
  created_at timestamptz not null default now()
);

-- Motoboys
create table if not exists public.motoboys (
  id         uuid primary key default uuid_generate_v4(),
  nome       text not null,
  telefone   text,
  placa      text,
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pedidos
create table if not exists public.pedidos (
  id              uuid primary key default uuid_generate_v4(),
  numero          text not null unique,
  cliente_id      uuid references public.clientes(id),
  vendedor_id     uuid references public.profiles(id),
  total           numeric(10,2) not null default 0,
  forma_entrega   text default 'entrega' check (forma_entrega in ('entrega','retirada')),
  forma_pagamento text default 'pix'    check (forma_pagamento in ('pix','cartao','avista','dinheiro')),
  cep             text,
  logradouro      text,
  numero_end      text,
  complemento     text,
  bairro          text,
  cidade          text,
  uf              text,
  troco_para      numeric(10,2),
  obs             text,
  origem          text default 'site',
  created_at      timestamptz not null default now()
);

-- Itens de cada pedido
create table if not exists public.itens_pedido (
  id                 uuid primary key default uuid_generate_v4(),
  pedido_id          uuid not null references public.pedidos(id) on delete cascade,
  cesta_id           text,
  cesta_nome         text not null,
  preco              numeric(10,2) not null,
  quantidade         int not null default 1,
  itens_selecionados jsonb,
  created_at         timestamptz not null default now()
);

-- Entregas (status do pedido)
create table if not exists public.entregas (
  id          uuid primary key default uuid_generate_v4(),
  pedido_id   uuid not null unique references public.pedidos(id) on delete cascade,
  motoboy_id  uuid references public.motoboys(id),
  status      text not null default 'pendente'
                check (status in ('pendente','em_preparo','saiu','entregue','cancelado')),
  taxa        numeric(10,2),
  obs_entrega text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Lançamentos financeiros (receitas e despesas)
create table if not exists public.lancamentos (
  id          uuid primary key default uuid_generate_v4(),
  tipo        text not null check (tipo in ('receita','despesa')),
  categoria   text not null,
  descricao   text,
  valor       numeric(10,2) not null,
  data        date not null,
  pedido_id   uuid references public.pedidos(id),
  user_id     uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- Configurações do sistema (chave-valor)
create table if not exists public.configuracoes (
  chave      text primary key,
  valor      text,
  updated_at timestamptz not null default now()
);

-- Metas de vendas (por vendedor/mês)
create table if not exists public.metas_vendas (
  id              uuid primary key default uuid_generate_v4(),
  vendedor_id     uuid references public.profiles(id),
  mes             date not null,
  meta_faturamento numeric(10,2),
  meta_pedidos    int,
  created_at      timestamptz not null default now(),
  unique (vendedor_id, mes)
);

-- ================================================================
-- TRIGGER: perfil criado automaticamente ao registrar usuário
-- ================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome, email, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'papel', 'vendedor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- TRIGGER: atualiza updated_at em entregas
-- ================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_entregas_updated on public.entregas;
create trigger trg_entregas_updated
  before update on public.entregas
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

alter table public.profiles      enable row level security;
alter table public.clientes      enable row level security;
alter table public.motoboys      enable row level security;
alter table public.pedidos       enable row level security;
alter table public.itens_pedido  enable row level security;
alter table public.entregas      enable row level security;
alter table public.lancamentos   enable row level security;
alter table public.configuracoes enable row level security;
alter table public.metas_vendas  enable row level security;

-- Helper: papel do usuário logado
create or replace function public.meu_papel()
returns text language sql security definer stable as $$
  select papel from public.profiles where id = auth.uid();
$$;

-- ── clientes ─────────────────────────────────────────────────────
-- Anônimo pode inserir (site público)
create policy "anon_insert_clientes" on public.clientes
  for insert to anon with check (true);

-- Autenticado pode ler e atualizar
create policy "auth_select_clientes" on public.clientes
  for select to authenticated using (true);

create policy "auth_update_clientes" on public.clientes
  for update to authenticated using (true);

-- ── pedidos ──────────────────────────────────────────────────────
create policy "anon_insert_pedidos" on public.pedidos
  for insert to anon with check (true);

create policy "auth_select_pedidos" on public.pedidos
  for select to authenticated using (true);

create policy "auth_update_pedidos" on public.pedidos
  for update to authenticated using (
    meu_papel() in ('admin','logistica','vendedor')
  );

-- ── itens_pedido ─────────────────────────────────────────────────
create policy "anon_insert_itens" on public.itens_pedido
  for insert to anon with check (true);

create policy "auth_select_itens" on public.itens_pedido
  for select to authenticated using (true);

-- ── entregas ─────────────────────────────────────────────────────
create policy "anon_insert_entregas" on public.entregas
  for insert to anon with check (true);

create policy "auth_select_entregas" on public.entregas
  for select to authenticated using (true);

create policy "auth_update_entregas" on public.entregas
  for update to authenticated using (
    meu_papel() in ('admin','logistica')
  );

-- ── lancamentos ──────────────────────────────────────────────────
create policy "anon_insert_lancamentos" on public.lancamentos
  for insert to anon with check (true);

create policy "auth_all_lancamentos" on public.lancamentos
  for all to authenticated using (
    meu_papel() in ('admin','financeiro')
  );

-- ── configuracoes ────────────────────────────────────────────────
create policy "auth_read_config" on public.configuracoes
  for select to authenticated using (true);

create policy "admin_write_config" on public.configuracoes
  for all to authenticated using (meu_papel() = 'admin');

-- ── motoboys ────────────────────────────────────────────────────
create policy "auth_read_motoboys" on public.motoboys
  for select to authenticated using (true);

create policy "admin_write_motoboys" on public.motoboys
  for all to authenticated using (
    meu_papel() in ('admin','logistica')
  );

-- ── profiles ────────────────────────────────────────────────────
create policy "own_profile" on public.profiles
  for select to authenticated using (id = auth.uid() or meu_papel() = 'admin');

create policy "admin_update_profiles" on public.profiles
  for update to authenticated using (meu_papel() = 'admin');

-- ── metas_vendas ────────────────────────────────────────────────
create policy "auth_read_metas" on public.metas_vendas
  for select to authenticated using (true);

create policy "admin_write_metas" on public.metas_vendas
  for all to authenticated using (meu_papel() = 'admin');

-- ================================================================
-- REALTIME (habilita publicações)
-- ================================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table
    public.pedidos,
    public.entregas,
    public.lancamentos;
commit;

-- ================================================================
-- DADOS INICIAIS (configurações padrão)
-- ================================================================
insert into public.configuracoes (chave, valor) values
  ('nome_empresa',       'RR Distribuidora'),
  ('whatsapp',           '5581996206567'),
  ('endereco',           'Rua Itaí, 71 — Recife/PE'),
  ('horario',            'Seg–Sex 08h–18h / Sáb 08h–13h'),
  ('taxa_entrega',       '5.00'),
  ('frete_gratis_acima', '0'),
  ('raio_entrega_km',    '10'),
  ('pagamento_pix',      'true'),
  ('pagamento_cartao',   'true'),
  ('pagamento_dinheiro', 'true'),
  ('chave_pix',          ''),
  ('comissao_percentual','5'),
  ('comissao_dia_corte', '25'),
  ('meta_faturamento',   '10000'),
  ('meta_clientes',      '30'),
  ('meta_pedidos',       '150'),
  ('bonus_faixa1_min',   '5000'),
  ('bonus_faixa1_valor', '200'),
  ('bonus_faixa2_min',   '8000'),
  ('bonus_faixa2_valor', '400'),
  ('bonus_faixa3_min',   '12000'),
  ('bonus_faixa3_valor', '700')
on conflict (chave) do nothing;

-- ================================================================
-- ÍNDICES
-- ================================================================
create index if not exists idx_pedidos_cliente    on public.pedidos(cliente_id);
create index if not exists idx_pedidos_created    on public.pedidos(created_at desc);
create index if not exists idx_entregas_status    on public.entregas(status);
create index if not exists idx_entregas_pedido    on public.entregas(pedido_id);
create index if not exists idx_lancamentos_data   on public.lancamentos(data desc);
create index if not exists idx_lancamentos_tipo   on public.lancamentos(tipo);
create index if not exists idx_itens_pedido       on public.itens_pedido(pedido_id);
create index if not exists idx_clientes_telefone  on public.clientes(telefone);
