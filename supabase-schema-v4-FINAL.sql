-- ================================================================
-- RR Distribuidora — SCHEMA COMPLETO v4 FINAL
-- Cole TUDO no SQL Editor do Supabase e execute de uma vez
-- Cria do zero com RLS correta: anon insere, authenticated lê
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. REMOVE TUDO (ordem importa por causa das FKs)
-- ================================================================
DROP TABLE IF EXISTS public.comissoes_afiliados  CASCADE;
DROP TABLE IF EXISTS public.estoque_movimentos   CASCADE;
DROP TABLE IF EXISTS public.afiliados            CASCADE;
DROP TABLE IF EXISTS public.produtos             CASCADE;
DROP TABLE IF EXISTS public.metas_vendas         CASCADE;
DROP TABLE IF EXISTS public.configuracoes        CASCADE;
DROP TABLE IF EXISTS public.lancamentos          CASCADE;
DROP TABLE IF EXISTS public.entregas             CASCADE;
DROP TABLE IF EXISTS public.itens_pedido         CASCADE;
DROP TABLE IF EXISTS public.pedidos              CASCADE;
DROP TABLE IF EXISTS public.motoboys             CASCADE;
DROP TABLE IF EXISTS public.clientes             CASCADE;
DROP TABLE IF EXISTS public.profiles             CASCADE;

DROP FUNCTION IF EXISTS public.meu_papel()                                           CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at()                                      CASCADE;
DROP FUNCTION IF EXISTS public.set_atualizado_em()                                   CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user()                                     CASCADE;
DROP FUNCTION IF EXISTS public.decrementar_ingredientes_pedido(TEXT[],INT,UUID,TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.decrementar_estoque_pedido(TEXT,INT,UUID,TEXT)        CASCADE;

-- ================================================================
-- 2. FUNÇÕES UTILITÁRIAS (criadas antes das tabelas)
-- ================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$;

-- ================================================================
-- 3. TABELAS
-- ================================================================

-- Perfis dos usuários internos (admin, vendedor, logística...)
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT,
  papel      TEXT NOT NULL DEFAULT 'vendedor'
               CHECK (papel IN ('admin','vendedor','logistica','financeiro','montador','motoboy')),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- meu_papel() — deve vir DEPOIS da tabela profiles
CREATE OR REPLACE FUNCTION public.meu_papel()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT papel FROM public.profiles WHERE id = auth.uid();
$$;

-- Clientes que fizeram pedido pelo site
CREATE TABLE public.clientes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  telefone   TEXT,
  email      TEXT,
  cpf        TEXT,
  origem     TEXT DEFAULT 'site',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Motoboys para logística de entrega
CREATE TABLE public.motoboys (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  telefone   TEXT,
  placa      TEXT,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Afiliados / influencers com código de indicação
CREATE TABLE public.afiliados (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT NOT NULL,
  telefone        TEXT,
  email           TEXT,
  instagram       TEXT,
  codigo          TEXT NOT NULL UNIQUE,
  comissao_pct    NUMERIC(5,2)  NOT NULL DEFAULT 5.00,
  total_vendas    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_comissoes NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  observacao      TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pedidos do site e do admin
CREATE TABLE public.pedidos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero           TEXT NOT NULL UNIQUE,
  cliente_id       UUID REFERENCES public.clientes(id),
  vendedor_id      UUID REFERENCES public.profiles(id),
  afiliado_id      UUID REFERENCES public.afiliados(id) ON DELETE SET NULL,
  total            NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_entrega    TEXT DEFAULT 'entrega'
                     CHECK (forma_entrega   IN ('entrega','retirada')),
  forma_pagamento  TEXT DEFAULT 'pix'
                     CHECK (forma_pagamento IN ('pix','cartao','avista','dinheiro','mercadopago')),
  status_pagamento TEXT NOT NULL DEFAULT 'pendente'
                     CHECK (status_pagamento IN ('pendente','pago','falhou','estornado')),
  mp_payment_id    TEXT,
  cep              TEXT,
  logradouro       TEXT,
  numero_end       TEXT,
  complemento      TEXT,
  bairro           TEXT,
  cidade           TEXT,
  uf               TEXT,
  troco_para       NUMERIC(10,2),
  obs              TEXT,
  origem           TEXT DEFAULT 'site',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens de cada pedido (cestas escolhidas)
CREATE TABLE public.itens_pedido (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id          UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  cesta_id           TEXT,
  cesta_nome         TEXT NOT NULL,
  preco              NUMERIC(10,2) NOT NULL,
  quantidade         INT NOT NULL DEFAULT 1,
  itens_selecionados JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entrega de cada pedido (one-to-one com pedidos)
CREATE TABLE public.entregas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id        UUID NOT NULL UNIQUE REFERENCES public.pedidos(id) ON DELETE CASCADE,
  motoboy_id       UUID REFERENCES public.motoboys(id),
  status           TEXT NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','em_preparo','saiu','entregue','cancelado')),
  taxa             NUMERIC(10,2),
  obs_entrega      TEXT,
  obs_cancelamento TEXT,
  saiu_em          TIMESTAMPTZ,
  entregue_em      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lançamentos financeiros (receitas e despesas)
CREATE TABLE public.lancamentos (
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

-- Configurações da loja (chave-valor)
CREATE TABLE public.configuracoes (
  chave      TEXT PRIMARY KEY,
  valor      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metas de vendas mensais
CREATE TABLE public.metas_vendas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id      UUID REFERENCES public.profiles(id),
  mes              DATE NOT NULL,
  meta_faturamento NUMERIC(10,2),
  meta_pedidos     INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendedor_id, mes)
);

-- Produtos: cestas (vendidas) e insumos (ingredientes comprados)
-- categoria inclui: cesta, insumo, embalagem, outro, alimento, limpeza, higiene
CREATE TABLE public.produtos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome           TEXT NOT NULL,
  descricao      TEXT,
  preco          NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo          NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque_atual  INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 5,
  unidade        TEXT NOT NULL DEFAULT 'un',
  categoria      TEXT NOT NULL DEFAULT 'insumo'
                   CHECK (categoria IN ('cesta','insumo','embalagem','outro','alimento','limpeza','higiene')),
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  imagem_url     TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Movimentações de estoque (entrada/saída/ajuste)
CREATE TABLE public.estoque_movimentos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  pedido_id  UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste','perda')),
  quantidade INTEGER NOT NULL,
  observacao TEXT,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comissões pagas aos afiliados
CREATE TABLE public.comissoes_afiliados (
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

-- ================================================================
-- 4. TRIGGERS
-- ================================================================

-- Cria perfil automaticamente ao criar usuário no Auth
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

DROP TRIGGER IF EXISTS trg_entregas_updated ON public.entregas;
CREATE TRIGGER trg_entregas_updated
  BEFORE UPDATE ON public.entregas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_produtos_atualizado ON public.produtos;
CREATE TRIGGER trg_produtos_atualizado
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

DROP TRIGGER IF EXISTS trg_afiliados_atualizado ON public.afiliados;
CREATE TRIGGER trg_afiliados_atualizado
  BEFORE UPDATE ON public.afiliados
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ================================================================
-- 5. RPC — Desconta ingredientes do estoque por pedido
--    SECURITY DEFINER = roda com permissão elevada (seguro)
--    anon pode chamar (cliente do site chama ao finalizar pedido)
-- ================================================================
CREATE OR REPLACE FUNCTION public.decrementar_ingredientes_pedido(
  p_itens      TEXT[],
  p_quantidade INTEGER,
  p_pedido_id  UUID,
  p_numero     TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nome TEXT;
  v_id   UUID;
BEGIN
  FOREACH v_nome IN ARRAY p_itens LOOP
    SELECT id INTO v_id
      FROM public.produtos
     WHERE nome ILIKE v_nome AND ativo = TRUE
     LIMIT 1;

    IF v_id IS NOT NULL THEN
      UPDATE public.produtos
         SET estoque_atual = GREATEST(0, estoque_atual - p_quantidade)
       WHERE id = v_id;

      INSERT INTO public.estoque_movimentos
        (produto_id, pedido_id, tipo, quantidade, observacao)
      VALUES
        (v_id, p_pedido_id, 'saida', p_quantidade,
         'Pedido #' || p_numero || ' — ' || v_nome);
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrementar_ingredientes_pedido TO anon;

-- ================================================================
-- 6. ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motoboys            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_vendas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afiliados           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_afiliados ENABLE ROW LEVEL SECURITY;

-- ── profiles ────────────────────────────────────────────────────
CREATE POLICY "own_profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR meu_papel() = 'admin');

CREATE POLICY "admin_update_profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (meu_papel() = 'admin');

CREATE POLICY "admin_insert_profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (meu_papel() = 'admin');

-- ── clientes ────────────────────────────────────────────────────
-- anon INSERT: cliente do site cria o próprio registro
-- authenticated SELECT/UPDATE: admin/vendedor vê todos
CREATE POLICY "anon_insert_clientes"
  ON public.clientes FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "auth_select_clientes"
  ON public.clientes FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "auth_update_clientes"
  ON public.clientes FOR UPDATE TO authenticated
  USING (TRUE);

-- ── pedidos ─────────────────────────────────────────────────────
-- anon INSERT: site insere pedido sem login
-- authenticated SELECT: admin/vendedor vê todos os pedidos no painel
-- authenticated UPDATE: admin/logistica/vendedor atualiza status
CREATE POLICY "anon_insert_pedidos"
  ON public.pedidos FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "auth_select_pedidos"
  ON public.pedidos FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "auth_update_pedidos"
  ON public.pedidos FOR UPDATE TO authenticated
  USING (meu_papel() IN ('admin','logistica','vendedor'));

-- ── itens_pedido ────────────────────────────────────────────────
CREATE POLICY "anon_insert_itens"
  ON public.itens_pedido FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "auth_select_itens"
  ON public.itens_pedido FOR SELECT TO authenticated
  USING (TRUE);

-- ── entregas ────────────────────────────────────────────────────
CREATE POLICY "anon_insert_entregas"
  ON public.entregas FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "auth_insert_entregas"
  ON public.entregas FOR INSERT TO authenticated
  WITH CHECK (meu_papel() IN ('admin','logistica','montador'));

CREATE POLICY "auth_select_entregas"
  ON public.entregas FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "auth_update_entregas"
  ON public.entregas FOR UPDATE TO authenticated
  USING (meu_papel() IN ('admin','logistica','montador','motoboy'));

-- ── lancamentos ─────────────────────────────────────────────────
CREATE POLICY "anon_insert_lancamentos"
  ON public.lancamentos FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "auth_select_lancamentos"
  ON public.lancamentos FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "auth_insert_lancamentos"
  ON public.lancamentos FOR INSERT TO authenticated
  WITH CHECK (meu_papel() IN ('admin','financeiro'));

CREATE POLICY "auth_update_lancamentos"
  ON public.lancamentos FOR UPDATE TO authenticated
  USING (meu_papel() IN ('admin','financeiro'));

CREATE POLICY "admin_delete_lancamentos"
  ON public.lancamentos FOR DELETE TO authenticated
  USING (meu_papel() = 'admin');

-- ── configuracoes ────────────────────────────────────────────────
CREATE POLICY "auth_read_config"
  ON public.configuracoes FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "admin_write_config"
  ON public.configuracoes FOR ALL TO authenticated
  USING (meu_papel() = 'admin');

-- ── motoboys ────────────────────────────────────────────────────
CREATE POLICY "auth_read_motoboys"
  ON public.motoboys FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "admin_write_motoboys"
  ON public.motoboys FOR ALL TO authenticated
  USING (meu_papel() IN ('admin','logistica'));

-- ── metas_vendas ────────────────────────────────────────────────
CREATE POLICY "auth_read_metas"
  ON public.metas_vendas FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "admin_write_metas"
  ON public.metas_vendas FOR ALL TO authenticated
  USING (meu_papel() = 'admin');

-- ── produtos ────────────────────────────────────────────────────
-- anon SELECT: site exibe ingredientes ativos para o cliente escolher
-- authenticated: admin/logística gerencia tudo
CREATE POLICY "anon_select_produtos"
  ON public.produtos FOR SELECT TO anon
  USING (ativo = TRUE);

CREATE POLICY "auth_select_produtos"
  ON public.produtos FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "auth_write_produtos"
  ON public.produtos FOR ALL TO authenticated
  USING (meu_papel() IN ('admin','logistica'))
  WITH CHECK (meu_papel() IN ('admin','logistica'));

-- ── estoque_movimentos ──────────────────────────────────────────
-- anon INSERT: RPC decrementar_ingredientes_pedido usa SECURITY DEFINER,
-- mas a policy garante que anon direto também possa (fallback)
CREATE POLICY "anon_insert_movimentos"
  ON public.estoque_movimentos FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "auth_select_movimentos"
  ON public.estoque_movimentos FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "auth_insert_movimentos"
  ON public.estoque_movimentos FOR INSERT TO authenticated
  WITH CHECK (meu_papel() IN ('admin','logistica'));

-- ── afiliados ───────────────────────────────────────────────────
CREATE POLICY "anon_select_afiliados"
  ON public.afiliados FOR SELECT TO anon
  USING (ativo = TRUE);

CREATE POLICY "auth_select_afiliados"
  ON public.afiliados FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "admin_write_afiliados"
  ON public.afiliados FOR ALL TO authenticated
  USING (meu_papel() = 'admin')
  WITH CHECK (meu_papel() = 'admin');

-- ── comissoes_afiliados ─────────────────────────────────────────
CREATE POLICY "anon_insert_comissoes"
  ON public.comissoes_afiliados FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "auth_select_comissoes"
  ON public.comissoes_afiliados FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "admin_update_comissoes"
  ON public.comissoes_afiliados FOR UPDATE TO authenticated
  USING (meu_papel() = 'admin');

-- ================================================================
-- 7. REALTIME (habilita para tabelas operacionais)
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE
      public.pedidos, public.entregas, public.lancamentos,
      public.produtos, public.estoque_movimentos,
      public.afiliados, public.comissoes_afiliados;
  ELSE
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;             EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.entregas;            EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos;         EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos;            EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.estoque_movimentos;  EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.afiliados;           EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.comissoes_afiliados; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END;
$$;

-- ================================================================
-- 8. ÍNDICES
-- ================================================================
CREATE INDEX idx_pedidos_cliente    ON public.pedidos(cliente_id);
CREATE INDEX idx_pedidos_created    ON public.pedidos(created_at DESC);
CREATE INDEX idx_pedidos_afiliado   ON public.pedidos(afiliado_id);
CREATE INDEX idx_pedidos_numero     ON public.pedidos(numero);
CREATE INDEX idx_entregas_status    ON public.entregas(status);
CREATE INDEX idx_entregas_pedido    ON public.entregas(pedido_id);
CREATE INDEX idx_lancamentos_data   ON public.lancamentos(data DESC);
CREATE INDEX idx_lancamentos_tipo   ON public.lancamentos(tipo);
CREATE INDEX idx_itens_pedido       ON public.itens_pedido(pedido_id);
CREATE INDEX idx_clientes_telefone  ON public.clientes(telefone);
CREATE INDEX idx_estmov_produto     ON public.estoque_movimentos(produto_id);
CREATE INDEX idx_estmov_pedido      ON public.estoque_movimentos(pedido_id);
CREATE INDEX idx_comissoes_afil     ON public.comissoes_afiliados(afiliado_id);
CREATE INDEX idx_comissoes_pedido   ON public.comissoes_afiliados(pedido_id);
CREATE INDEX idx_afiliados_codigo   ON public.afiliados(codigo);

-- ================================================================
-- 9. CONFIGURAÇÕES DA LOJA
-- ================================================================
INSERT INTO public.configuracoes (chave, valor) VALUES
  ('nome_empresa',            'RR Distribuidora'),
  ('whatsapp',                '5581996206567'),
  ('endereco',                'Rua Itaí, 71 — Recife/PE'),
  ('horario',                 'Seg–Sex 08h–18h / Sáb 08h–13h'),
  ('email',                   'contato@rrdistribuidora.com.br'),
  ('msg_whatsapp',            'Olá! Gostaria de confirmar meu pedido.'),
  ('taxa_entrega',            '5.00'),
  ('frete_gratis_acima',      '0'),
  ('raio_entrega_km',         '10'),
  ('pagamento_pix',           'true'),
  ('pagamento_cartao',        'true'),
  ('pagamento_dinheiro',      'true'),
  ('chave_pix',               ''),
  ('comissao_vendedor_cesta', '20'),
  ('comissao_motoboy',        '14'),
  ('comissao_percentual',     '5'),
  ('comissao_dia_corte',      '25'),
  ('meta_faturamento',        '10000'),
  ('meta_clientes',           '30'),
  ('meta_pedidos',            '150'),
  ('bonus_faixa1_min',        '5000'),
  ('bonus_faixa1_valor',      '200'),
  ('bonus_faixa2_min',        '8000'),
  ('bonus_faixa2_valor',      '400'),
  ('bonus_faixa3_min',        '12000'),
  ('bonus_faixa3_valor',      '700'),
  ('taxas_bairros',           '[{"bairro":"Bomba do Hemetério","municipio":"Recife","taxa":5},{"bairro":"Av. Norte","municipio":"Recife","taxa":5},{"bairro":"Casa Amarela","municipio":"Recife","taxa":5},{"bairro":"Arruda","municipio":"Recife","taxa":5},{"bairro":"Nova Descoberta","municipio":"Recife","taxa":5},{"bairro":"Macaxeira","municipio":"Recife","taxa":5},{"bairro":"Boa Viagem","municipio":"Recife","taxa":5},{"bairro":"Pina","municipio":"Recife","taxa":5},{"bairro":"Torre","municipio":"Recife","taxa":5},{"bairro":"Ilha do Retiro","municipio":"Recife","taxa":5},{"bairro":"Sucupira","municipio":"Recife","taxa":5},{"bairro":"Barra de Jangada","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Muribeca","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Prazeres","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Candeias","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Cajueiro Seco","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Marcos Freire","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Jaboatão Centro","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Vila Rica","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Santo Aleixo","municipio":"Jaboatão dos Guararapes","taxa":10},{"bairro":"Olinda Centro","municipio":"Olinda","taxa":15},{"bairro":"Paulista","municipio":"Paulista","taxa":20},{"bairro":"Rio Doce","municipio":"Olinda","taxa":20},{"bairro":"São Lourenço da Mata","municipio":"São Lourenço da Mata","taxa":20},{"bairro":"Aldeia","municipio":"Camaragibe","taxa":20},{"bairro":"Ponte dos Carvalhos","municipio":"Cabo de Santo Agostinho","taxa":20},{"bairro":"Cabo de Santo Agostinho","municipio":"Cabo de Santo Agostinho","taxa":25},{"bairro":"Abreu e Lima","municipio":"Abreu e Lima","taxa":35},{"bairro":"Igarassu","municipio":"Igarassu","taxa":40}]')
ON CONFLICT (chave) DO NOTHING;

-- ================================================================
-- 10. PRODUTOS — Cestas vendidas + Insumos/ingredientes
-- ================================================================

-- CESTAS: o que a RR vende ao cliente
INSERT INTO public.produtos (nome, descricao, preco, custo, estoque_atual, estoque_minimo, unidade, categoria) VALUES
  ('Cesta Simples 1kg',    'Cesta básica 1kg',                     25.00,  18.00,  50, 10, 'un', 'cesta'),
  ('Cesta Simples 2kg',    'Cesta básica 2kg',                     45.00,  32.00,  40,  8, 'un', 'cesta'),
  ('Cesta Simples 3kg',    'Cesta básica 3kg',                     65.00,  47.00,  35,  8, 'un', 'cesta'),
  ('Cesta Simples 4kg',    'Cesta básica 4kg',                     80.00,  58.00,  30,  5, 'un', 'cesta'),
  ('Cesta Simples 5kg',    'Cesta básica 5kg',                     95.00,  69.00,  25,  5, 'un', 'cesta'),
  ('Cesta Simples 6kg',    'Cesta básica 6kg',                    110.00,  79.00,  20,  5, 'un', 'cesta'),
  ('Cesta Simples 7kg',    'Cesta básica 7kg',                    125.00,  90.00,  20,  5, 'un', 'cesta'),
  ('Cesta Simples 8kg',    'Cesta básica 8kg',                    140.00, 100.00,  15,  5, 'un', 'cesta'),
  ('Cesta Simples 9kg',    'Cesta básica 9kg',                    155.00, 111.00,  15,  3, 'un', 'cesta'),
  ('Cesta Simples 10kg',   'Cesta básica 10kg',                   170.00, 122.00,  10,  3, 'un', 'cesta'),
  ('Cesta Simples 11kg',   'Cesta básica 11kg',                   185.00, 133.00,  10,  3, 'un', 'cesta'),
  ('Cesta Completa 1kg',   'Cesta completa com maior variedade',  160.00, 115.00,  30,  8, 'un', 'cesta'),
  ('Cesta Completa 2kg',   'Mais itens, mais qualidade',          180.00, 129.00,  25,  8, 'un', 'cesta'),
  ('Cesta Completa 3kg',   'Cesta reforçada premium',             205.00, 147.00,  20,  5, 'un', 'cesta'),
  ('Cesta Completa 4kg',   'Variedade premium semanal',           225.00, 162.00,  20,  5, 'un', 'cesta'),
  ('Cesta Completa 5kg',   'Ideal para famílias exigentes',       250.00, 180.00,  15,  5, 'un', 'cesta'),
  ('Cesta Completa 6kg',   'Alimentos e higiene completos',       265.00, 191.00,  15,  5, 'un', 'cesta'),
  ('Cesta Completa 7kg',   'Abastecimento quinzenal premium',     285.00, 205.00,  12,  3, 'un', 'cesta'),
  ('Cesta Completa 8kg',   'Para famílias de 4 a 5 pessoas',      305.00, 220.00,  10,  3, 'un', 'cesta'),
  ('Cesta Completa 9kg',   'Ampla seleção premium',               320.00, 230.00,  10,  3, 'un', 'cesta'),
  ('Cesta Completa 10kg',  'Abastecimento mensal premium',        340.00, 245.00,   8,  3, 'un', 'cesta'),
  ('Cesta Completa 11kg',  'A cesta mais robusta da RR',          360.00, 259.00,   8,  3, 'un', 'cesta'),
  ('Cesta Popular',        'Produtos essenciais acessíveis',      100.00,  72.00,  20,  5, 'un', 'cesta'),
  ('Cesta Diferenciada',   'Cesta especial diferenciada',         260.00, 187.00,  10,  3, 'un', 'cesta'),
  ('Cesta Montada',        'Montada com critério e qualidade',    390.00, 281.00,   8,  3, 'un', 'cesta'),
  ('Cesta Top RR',         'O máximo em qualidade e variedade',   410.00, 295.00,   5,  2, 'un', 'cesta')
ON CONFLICT DO NOTHING;

-- INSUMOS/INGREDIENTES: o que a RR compra para montar as cestas
INSERT INTO public.produtos (nome, descricao, preco, custo, estoque_atual, estoque_minimo, unidade, categoria) VALUES
  ('Arroz 5kg',                   'Arroz branco 5kg',               22.00, 18.50, 200, 50, 'un', 'alimento'),
  ('Feijão 1kg',                  'Feijão carioca 1kg',             10.00,  7.80, 200, 50, 'un', 'alimento'),
  ('Açúcar 2kg',                  'Açúcar cristal 2kg',              9.00,  7.00, 200, 50, 'un', 'alimento'),
  ('Sal 1kg',                     'Sal refinado 1kg',                3.50,  2.50, 200, 50, 'un', 'alimento'),
  ('Óleo de Soja 900ml',          'Óleo de soja 900ml',             10.00,  8.20, 200, 50, 'un', 'alimento'),
  ('Farinha de Trigo 1kg',        'Farinha de trigo 1kg',            5.00,  3.80, 150, 40, 'un', 'alimento'),
  ('Macarrão 500g',               'Macarrão espaguete 500g',         4.50,  3.20, 150, 40, 'un', 'alimento'),
  ('Molho de Tomate 340g',        'Molho de tomate 340g',            4.00,  2.90, 150, 40, 'un', 'alimento'),
  ('Sardinha 125g',               'Sardinha em óleo 125g',           6.50,  5.00, 100, 30, 'un', 'alimento'),
  ('Café 250g',                   'Café torrado e moído 250g',       9.00,  7.00, 100, 30, 'un', 'alimento'),
  ('Biscoito Cream Cracker 400g', 'Biscoito cream cracker 400g',     6.00,  4.50, 100, 30, 'un', 'alimento'),
  ('Leite em Pó 400g',            'Leite em pó 400g',               18.00, 14.00, 100, 30, 'un', 'alimento'),
  ('Achocolatado 400g',           'Achocolatado em pó 400g',        14.00, 10.50, 100, 30, 'un', 'alimento'),
  ('Sabão em Pó 1kg',             'Sabão em pó 1kg',                12.00,  9.00, 100, 30, 'un', 'limpeza'),
  ('Amaciante 500ml',             'Amaciante de roupas 500ml',       8.00,  6.00, 100, 30, 'un', 'limpeza'),
  ('Detergente 500ml',            'Detergente líquido 500ml',        3.50,  2.50, 100, 30, 'un', 'limpeza'),
  ('Papel Higiênico 4un',         'Papel higiênico 4 rolos',         8.00,  6.00, 100, 30, 'un', 'limpeza'),
  ('Creme Dental',                'Creme dental 90g',                4.50,  3.20,  80, 20, 'un', 'higiene'),
  ('Sabonete',                    'Sabonete 90g',                    3.00,  2.00,  80, 20, 'un', 'higiene')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 11. ADMIN PADRÃO — garante papel admin ao usuário principal
--     (só funciona se o usuário já existir no Auth)
-- ================================================================
INSERT INTO public.profiles (id, nome, email, papel, ativo)
SELECT id, 'Admin RR', email, 'admin', true
  FROM auth.users
 WHERE email = 'alphacred2025@gmail.com'
ON CONFLICT (id) DO UPDATE SET papel = 'admin', nome = 'Admin RR', ativo = true;

-- ================================================================
-- FIM — RR Distribuidora Schema v4 FINAL
-- ================================================================
