-- ================================================================
-- RR Distribuidora — Schema Completo (v1 + v2)
-- Execute TUDO de uma vez no SQL Editor do Supabase
-- Pode ser re-executado com segurança (IF NOT EXISTS em tudo)
-- ================================================================

-- ── Extensões ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- FUNÇÕES AUXILIARES (criar antes das tabelas)
-- ================================================================

-- Papel do usuário logado (usada nas políticas RLS)
CREATE OR REPLACE FUNCTION public.meu_papel()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT papel FROM public.profiles WHERE id = auth.uid();
$$;

-- Trigger para atualizar campo updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar campo atualizado_em (tabelas v2)
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

-- ================================================================
-- TABELAS BASE (v1)
-- ================================================================

-- Perfis dos usuários internos (espelha auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT,
  papel      TEXT NOT NULL DEFAULT 'vendedor'
               CHECK (papel IN ('admin','vendedor','logistica','financeiro')),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clientes do site
CREATE TABLE IF NOT EXISTS public.clientes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  telefone   TEXT,
  email      TEXT,
  cpf        TEXT,
  origem     TEXT DEFAULT 'site',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Motoboys
CREATE TABLE IF NOT EXISTS public.motoboys (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  telefone   TEXT,
  placa      TEXT,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero          TEXT NOT NULL UNIQUE,
  cliente_id      UUID REFERENCES public.clientes(id),
  vendedor_id     UUID REFERENCES public.profiles(id),
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_entrega   TEXT DEFAULT 'entrega'  CHECK (forma_entrega  IN ('entrega','retirada')),
  forma_pagamento TEXT DEFAULT 'pix'      CHECK (forma_pagamento IN ('pix','cartao','avista','dinheiro')),
  cep             TEXT,
  logradouro      TEXT,
  numero_end      TEXT,
  complemento     TEXT,
  bairro          TEXT,
  cidade          TEXT,
  uf              TEXT,
  troco_para      NUMERIC(10,2),
  obs             TEXT,
  origem          TEXT DEFAULT 'site',
  afiliado_id     UUID,  -- FK adicionada abaixo (após criar tabela afiliados)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens de cada pedido
CREATE TABLE IF NOT EXISTS public.itens_pedido (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id          UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  cesta_id           TEXT,
  cesta_nome         TEXT NOT NULL,
  preco              NUMERIC(10,2) NOT NULL,
  quantidade         INT NOT NULL DEFAULT 1,
  itens_selecionados JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entregas
CREATE TABLE IF NOT EXISTS public.entregas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id   UUID NOT NULL UNIQUE REFERENCES public.pedidos(id) ON DELETE CASCADE,
  motoboy_id  UUID REFERENCES public.motoboys(id),
  status      TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente','em_preparo','saiu','entregue','cancelado')),
  taxa        NUMERIC(10,2),
  obs_entrega TEXT,
  saiu_em     TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lançamentos financeiros
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo       TEXT NOT NULL CHECK (tipo IN ('receita','despesa')),
  categoria  TEXT NOT NULL,
  descricao  TEXT,
  valor      NUMERIC(10,2) NOT NULL,
  data       DATE NOT NULL,
  pedido_id  UUID REFERENCES public.pedidos(id),
  user_id    UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações (chave-valor)
CREATE TABLE IF NOT EXISTS public.configuracoes (
  chave      TEXT PRIMARY KEY,
  valor      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metas de vendas
CREATE TABLE IF NOT EXISTS public.metas_vendas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id      UUID REFERENCES public.profiles(id),
  mes              DATE NOT NULL,
  meta_faturamento NUMERIC(10,2),
  meta_pedidos     INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendedor_id, mes)
);

-- ================================================================
-- TABELAS V2: Estoque e Afiliados
-- ================================================================

-- Produtos / Cestas
CREATE TABLE IF NOT EXISTS public.produtos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome           TEXT NOT NULL,
  descricao      TEXT,
  preco          NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo          NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque_atual  INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 5,
  unidade        TEXT NOT NULL DEFAULT 'un',
  categoria      TEXT NOT NULL DEFAULT 'cesta',
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  imagem_url     TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Movimentações de estoque
CREATE TABLE IF NOT EXISTS public.estoque_movimentos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  pedido_id  UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste','perda')),
  quantidade INTEGER NOT NULL,
  observacao TEXT,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Afiliados / Influencers
CREATE TABLE IF NOT EXISTS public.afiliados (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT NOT NULL,
  telefone        TEXT,
  email           TEXT,
  instagram       TEXT,
  codigo          TEXT NOT NULL UNIQUE,
  comissao_pct    NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  total_vendas    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_comissoes NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  observacao      TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comissões dos afiliados
CREATE TABLE IF NOT EXISTS public.comissoes_afiliados (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  afiliado_id   UUID NOT NULL REFERENCES public.afiliados(id) ON DELETE CASCADE,
  pedido_id     UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  valor_pedido  NUMERIC(10,2) NOT NULL,
  pct           NUMERIC(5,2)  NOT NULL,
  valor         NUMERIC(10,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','aprovada','paga','cancelada')),
  pago_em       DATE,
  lancamento_id UUID REFERENCES public.lancamentos(id) ON DELETE SET NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK afiliado_id em pedidos (adicionada após criar tabela afiliados)
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS afiliado_id_ref UUID REFERENCES public.afiliados(id) ON DELETE SET NULL;

-- Migra coluna se já existia sem FK, senão apenas garante a FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pedidos' AND column_name = 'afiliado_id'
    AND data_type = 'uuid'
  ) THEN
    -- coluna não existia ainda, renomeia a temporária
    ALTER TABLE public.pedidos RENAME COLUMN afiliado_id_ref TO afiliado_id;
  ELSE
    -- coluna já existe, remove a temporária
    ALTER TABLE public.pedidos DROP COLUMN IF EXISTS afiliado_id_ref;
    -- adiciona FK se ainda não existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'pedidos'
        AND kcu.column_name = 'afiliado_id'
    ) THEN
      ALTER TABLE public.pedidos
        ADD CONSTRAINT pedidos_afiliado_id_fkey
        FOREIGN KEY (afiliado_id) REFERENCES public.afiliados(id) ON DELETE SET NULL;
    END IF;
  END IF;
END;
$$;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Perfil automático ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, papel)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', SPLIT_PART(NEW.email,'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'papel', 'vendedor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at em entregas
DROP TRIGGER IF EXISTS trg_entregas_updated ON public.entregas;
CREATE TRIGGER trg_entregas_updated
  BEFORE UPDATE ON public.entregas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- atualizado_em em produtos
DROP TRIGGER IF EXISTS trg_produtos_atualizado ON public.produtos;
CREATE TRIGGER trg_produtos_atualizado
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- atualizado_em em afiliados
DROP TRIGGER IF EXISTS trg_afiliados_atualizado ON public.afiliados;
CREATE TRIGGER trg_afiliados_atualizado
  BEFORE UPDATE ON public.afiliados
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motoboys          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_vendas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afiliados         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_afiliados ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_profile"            ON public.profiles;
DROP POLICY IF EXISTS "admin_update_profiles"  ON public.profiles;
CREATE POLICY "own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR meu_papel() = 'admin');
CREATE POLICY "admin_update_profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (meu_papel() = 'admin');
CREATE POLICY "admin_insert_profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (meu_papel() = 'admin');

-- ── clientes ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_clientes"  ON public.clientes;
DROP POLICY IF EXISTS "auth_select_clientes"  ON public.clientes;
DROP POLICY IF EXISTS "auth_update_clientes"  ON public.clientes;
CREATE POLICY "anon_insert_clientes" ON public.clientes
  FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "auth_select_clientes" ON public.clientes
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_update_clientes" ON public.clientes
  FOR UPDATE TO authenticated USING (TRUE);

-- ── pedidos ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_pedidos"  ON public.pedidos;
DROP POLICY IF EXISTS "auth_select_pedidos"  ON public.pedidos;
DROP POLICY IF EXISTS "auth_update_pedidos"  ON public.pedidos;
CREATE POLICY "anon_insert_pedidos" ON public.pedidos
  FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "auth_select_pedidos" ON public.pedidos
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_update_pedidos" ON public.pedidos
  FOR UPDATE TO authenticated USING (meu_papel() IN ('admin','logistica','vendedor'));

-- ── itens_pedido ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_itens"  ON public.itens_pedido;
DROP POLICY IF EXISTS "auth_select_itens"  ON public.itens_pedido;
CREATE POLICY "anon_insert_itens" ON public.itens_pedido
  FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "auth_select_itens" ON public.itens_pedido
  FOR SELECT TO authenticated USING (TRUE);

-- ── entregas ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_entregas"  ON public.entregas;
DROP POLICY IF EXISTS "auth_select_entregas"  ON public.entregas;
DROP POLICY IF EXISTS "auth_update_entregas"  ON public.entregas;
CREATE POLICY "anon_insert_entregas" ON public.entregas
  FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "auth_select_entregas" ON public.entregas
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_update_entregas" ON public.entregas
  FOR UPDATE TO authenticated USING (meu_papel() IN ('admin','logistica'));

-- ── lancamentos ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_lancamentos"  ON public.lancamentos;
DROP POLICY IF EXISTS "auth_all_lancamentos"     ON public.lancamentos;
CREATE POLICY "anon_insert_lancamentos" ON public.lancamentos
  FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "auth_select_lancamentos" ON public.lancamentos
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_insert_lancamentos" ON public.lancamentos
  FOR INSERT TO authenticated WITH CHECK (meu_papel() IN ('admin','financeiro'));
CREATE POLICY "admin_delete_lancamentos" ON public.lancamentos
  FOR DELETE TO authenticated USING (meu_papel() = 'admin');

-- ── configuracoes ────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_read_config"   ON public.configuracoes;
DROP POLICY IF EXISTS "admin_write_config" ON public.configuracoes;
CREATE POLICY "auth_read_config" ON public.configuracoes
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_write_config" ON public.configuracoes
  FOR ALL TO authenticated USING (meu_papel() = 'admin');

-- ── motoboys ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_read_motoboys"  ON public.motoboys;
DROP POLICY IF EXISTS "admin_write_motoboys" ON public.motoboys;
CREATE POLICY "auth_read_motoboys" ON public.motoboys
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_write_motoboys" ON public.motoboys
  FOR ALL TO authenticated USING (meu_papel() IN ('admin','logistica'));

-- ── metas_vendas ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_read_metas"  ON public.metas_vendas;
DROP POLICY IF EXISTS "admin_write_metas" ON public.metas_vendas;
CREATE POLICY "auth_read_metas" ON public.metas_vendas
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_write_metas" ON public.metas_vendas
  FOR ALL TO authenticated USING (meu_papel() = 'admin');

-- ── produtos ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_produtos"     ON public.produtos;
DROP POLICY IF EXISTS "auth_select_produtos"     ON public.produtos;
DROP POLICY IF EXISTS "auth_write_produtos"      ON public.produtos;
CREATE POLICY "anon_select_produtos" ON public.produtos
  FOR SELECT TO anon USING (ativo = TRUE);
CREATE POLICY "auth_select_produtos" ON public.produtos
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_write_produtos" ON public.produtos
  FOR ALL TO authenticated
  USING (meu_papel() IN ('admin','logistica'))
  WITH CHECK (meu_papel() IN ('admin','logistica'));

-- ── estoque_movimentos ───────────────────────────────────────────
DROP POLICY IF EXISTS "auth_select_movimentos"  ON public.estoque_movimentos;
DROP POLICY IF EXISTS "anon_insert_movimentos"  ON public.estoque_movimentos;
DROP POLICY IF EXISTS "auth_insert_movimentos"  ON public.estoque_movimentos;
CREATE POLICY "auth_select_movimentos" ON public.estoque_movimentos
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "anon_insert_movimentos" ON public.estoque_movimentos
  FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "auth_insert_movimentos" ON public.estoque_movimentos
  FOR INSERT TO authenticated WITH CHECK (meu_papel() IN ('admin','logistica'));

-- ── afiliados ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_afiliados"  ON public.afiliados;
DROP POLICY IF EXISTS "auth_select_afiliados"  ON public.afiliados;
DROP POLICY IF EXISTS "admin_write_afiliados"  ON public.afiliados;
CREATE POLICY "anon_select_afiliados" ON public.afiliados
  FOR SELECT TO anon USING (ativo = TRUE);
CREATE POLICY "auth_select_afiliados" ON public.afiliados
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_write_afiliados" ON public.afiliados
  FOR ALL TO authenticated
  USING (meu_papel() = 'admin')
  WITH CHECK (meu_papel() = 'admin');

-- ── comissoes_afiliados ──────────────────────────────────────────
DROP POLICY IF EXISTS "auth_select_comissoes"  ON public.comissoes_afiliados;
DROP POLICY IF EXISTS "anon_insert_comissoes"  ON public.comissoes_afiliados;
DROP POLICY IF EXISTS "admin_update_comissoes" ON public.comissoes_afiliados;
CREATE POLICY "auth_select_comissoes" ON public.comissoes_afiliados
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "anon_insert_comissoes" ON public.comissoes_afiliados
  FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "admin_update_comissoes" ON public.comissoes_afiliados
  FOR UPDATE TO authenticated USING (meu_papel() = 'admin');

-- ================================================================
-- REALTIME
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE
      public.pedidos, public.entregas, public.lancamentos,
      public.produtos, public.estoque_movimentos,
      public.afiliados, public.comissoes_afiliados;
  ELSE
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.entregas;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.estoque_movimentos;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.afiliados;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comissoes_afiliados;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END;
$$;

-- ================================================================
-- ÍNDICES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente    ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created    ON public.pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_afiliado   ON public.pedidos(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status    ON public.entregas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_pedido    ON public.entregas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data   ON public.lancamentos(data DESC);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo   ON public.lancamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_itens_pedido       ON public.itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone  ON public.clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_estmov_produto     ON public.estoque_movimentos(produto_id);
CREATE INDEX IF NOT EXISTS idx_estmov_pedido      ON public.estoque_movimentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_afil     ON public.comissoes_afiliados(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_pedido   ON public.comissoes_afiliados(pedido_id);
CREATE INDEX IF NOT EXISTS idx_afiliados_codigo   ON public.afiliados(codigo);

-- ================================================================
-- DADOS INICIAIS
-- ================================================================

-- Configurações padrão
INSERT INTO public.configuracoes (chave, valor) VALUES
  ('nome_empresa',             'RR Distribuidora'),
  ('whatsapp',                 '5581996206567'),
  ('endereco',                 'Rua Itaí, 71 — Recife/PE'),
  ('horario',                  'Seg–Sex 08h–18h / Sáb 08h–13h'),
  ('email',                    'contato@rrdistribuidora.com.br'),
  ('msg_whatsapp',             'Olá! Gostaria de confirmar meu pedido.'),
  ('taxa_entrega',             '5.00'),
  ('frete_gratis_acima',       '0'),
  ('raio_entrega_km',          '10'),
  ('pagamento_pix',            'true'),
  ('pagamento_cartao',         'true'),
  ('pagamento_dinheiro',       'true'),
  ('chave_pix',                ''),
  ('comissao_vendedor_cesta',  '20'),
  ('comissao_motoboy',         '14'),
  ('comissao_percentual',      '5'),
  ('comissao_dia_corte',       '25'),
  ('meta_faturamento',         '10000'),
  ('meta_clientes',            '30'),
  ('meta_pedidos',             '150'),
  ('bonus_faixa1_min',         '5000'),
  ('bonus_faixa1_valor',       '200'),
  ('bonus_faixa2_min',         '8000'),
  ('bonus_faixa2_valor',       '400'),
  ('bonus_faixa3_min',         '12000'),
  ('bonus_faixa3_valor',       '700')
ON CONFLICT (chave) DO NOTHING;

-- Cestas RR (produtos iniciais)
INSERT INTO public.produtos (nome, descricao, preco, custo, estoque_atual, estoque_minimo, unidade, categoria) VALUES
  ('Cesta 1kg',  'Cesta básica 1kg',   25.00,  18.00, 50, 10, 'un', 'cesta'),
  ('Cesta 2kg',  'Cesta básica 2kg',   45.00,  32.00, 40,  8, 'un', 'cesta'),
  ('Cesta 3kg',  'Cesta básica 3kg',   65.00,  47.00, 35,  8, 'un', 'cesta'),
  ('Cesta 4kg',  'Cesta básica 4kg',   80.00,  58.00, 30,  5, 'un', 'cesta'),
  ('Cesta 5kg',  'Cesta básica 5kg',   95.00,  69.00, 25,  5, 'un', 'cesta'),
  ('Cesta 6kg',  'Cesta básica 6kg',  110.00,  79.00, 20,  5, 'un', 'cesta'),
  ('Cesta 7kg',  'Cesta básica 7kg',  125.00,  90.00, 20,  5, 'un', 'cesta'),
  ('Cesta 8kg',  'Cesta básica 8kg',  140.00, 100.00, 15,  5, 'un', 'cesta'),
  ('Cesta 9kg',  'Cesta básica 9kg',  155.00, 111.00, 15,  3, 'un', 'cesta'),
  ('Cesta 10kg', 'Cesta básica 10kg', 170.00, 122.00, 10,  3, 'un', 'cesta'),
  ('Cesta 11kg', 'Cesta básica 11kg', 185.00, 133.00, 10,  3, 'un', 'cesta')
ON CONFLICT DO NOTHING;

-- ================================================================
-- FIM DO SCHEMA — RR Distribuidora
-- ================================================================
