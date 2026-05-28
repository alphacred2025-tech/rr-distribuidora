-- ============================================================
-- supabase-schema-v2.sql — RR Distribuidora
-- Executa APÓS supabase-schema.sql
-- Adiciona: produtos, estoque_movimentos, afiliados, comissoes_afiliados
-- ============================================================

-- ── Produtos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.produtos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  descricao       TEXT,
  preco           NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo           NUMERIC(10,2) DEFAULT 0,
  estoque_atual   INTEGER NOT NULL DEFAULT 0,
  estoque_minimo  INTEGER NOT NULL DEFAULT 5,
  unidade         TEXT NOT NULL DEFAULT 'un',
  categoria       TEXT NOT NULL DEFAULT 'cesta',
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  imagem_url      TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at em produtos
CREATE OR REPLACE TRIGGER produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Estoque Movimentos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estoque_movimentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  pedido_id   UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  tipo        TEXT NOT NULL CHECK(tipo IN ('entrada','saida','ajuste','perda')),
  quantidade  INTEGER NOT NULL,
  observacao  TEXT,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Afiliados ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.afiliados (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE OR REPLACE TRIGGER afiliados_updated_at
  BEFORE UPDATE ON public.afiliados
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Comissões Afiliados ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comissoes_afiliados (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id  UUID NOT NULL REFERENCES public.afiliados(id) ON DELETE CASCADE,
  pedido_id    UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  valor_pedido NUMERIC(10,2) NOT NULL,
  pct          NUMERIC(5,2) NOT NULL,
  valor        NUMERIC(10,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','aprovada','paga','cancelada')),
  pago_em      DATE,
  lancamento_id UUID REFERENCES public.lancamentos(id) ON DELETE SET NULL,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ALTER: afiliado_id em pedidos ────────────────────────────
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS afiliado_id UUID REFERENCES public.afiliados(id) ON DELETE SET NULL;

-- ── RLS: produtos ─────────────────────────────────────────────
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon pode ver produtos ativos" ON public.produtos
  FOR SELECT TO anon USING (ativo = TRUE);

CREATE POLICY "auth pode ver todos produtos" ON public.produtos
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "admin e logistica gerenciam produtos" ON public.produtos
  FOR ALL TO authenticated USING (meu_papel() IN ('admin','logistica'))
  WITH CHECK (meu_papel() IN ('admin','logistica'));

-- ── RLS: estoque_movimentos ───────────────────────────────────
ALTER TABLE public.estoque_movimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth pode ver movimentos" ON public.estoque_movimentos
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "admin e logistica gerenciam movimentos" ON public.estoque_movimentos
  FOR INSERT TO authenticated WITH CHECK (meu_papel() IN ('admin','logistica'));

CREATE POLICY "anon pode inserir movimentos" ON public.estoque_movimentos
  FOR INSERT TO anon WITH CHECK (TRUE);

-- ── RLS: afiliados ────────────────────────────────────────────
ALTER TABLE public.afiliados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon pode ver codigo afiliado" ON public.afiliados
  FOR SELECT TO anon USING (ativo = TRUE);

CREATE POLICY "auth pode ver afiliados" ON public.afiliados
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "admin gerencia afiliados" ON public.afiliados
  FOR ALL TO authenticated USING (meu_papel() = 'admin')
  WITH CHECK (meu_papel() = 'admin');

-- ── RLS: comissoes_afiliados ──────────────────────────────────
ALTER TABLE public.comissoes_afiliados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth pode ver comissoes" ON public.comissoes_afiliados
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "anon pode inserir comissao" ON public.comissoes_afiliados
  FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "admin gerencia comissoes" ON public.comissoes_afiliados
  FOR UPDATE TO authenticated USING (meu_papel() = 'admin');

-- ── Dados iniciais: Cestas RR ─────────────────────────────────
INSERT INTO public.produtos (nome, descricao, preco, custo, estoque_atual, estoque_minimo, unidade, categoria) VALUES
  ('Cesta 1kg',  'Cesta básica 1kg',  25.00,  18.00, 50, 10, 'un', 'cesta'),
  ('Cesta 2kg',  'Cesta básica 2kg',  45.00,  32.00, 40, 8,  'un', 'cesta'),
  ('Cesta 3kg',  'Cesta básica 3kg',  65.00,  47.00, 35, 8,  'un', 'cesta'),
  ('Cesta 4kg',  'Cesta básica 4kg',  80.00,  58.00, 30, 5,  'un', 'cesta'),
  ('Cesta 5kg',  'Cesta básica 5kg',  95.00,  69.00, 25, 5,  'un', 'cesta'),
  ('Cesta 6kg',  'Cesta básica 6kg', 110.00,  79.00, 20, 5,  'un', 'cesta'),
  ('Cesta 7kg',  'Cesta básica 7kg', 125.00,  90.00, 20, 5,  'un', 'cesta'),
  ('Cesta 8kg',  'Cesta básica 8kg', 140.00, 100.00, 15, 5,  'un', 'cesta'),
  ('Cesta 9kg',  'Cesta básica 9kg', 155.00, 111.00, 15, 3,  'un', 'cesta'),
  ('Cesta 10kg', 'Cesta básica 10kg',170.00, 122.00, 10, 3,  'un', 'cesta'),
  ('Cesta 11kg', 'Cesta básica 11kg',185.00, 133.00, 10, 3,  'un', 'cesta')
ON CONFLICT DO NOTHING;

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_estmov_produto  ON public.estoque_movimentos(produto_id);
CREATE INDEX IF NOT EXISTS idx_estmov_pedido   ON public.estoque_movimentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_afil  ON public.comissoes_afiliados(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_pedido ON public.comissoes_afiliados(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_afiliado ON public.pedidos(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_afiliados_codigo ON public.afiliados(codigo);

-- ── Realtime ──────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.estoque_movimentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.afiliados;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comissoes_afiliados;
