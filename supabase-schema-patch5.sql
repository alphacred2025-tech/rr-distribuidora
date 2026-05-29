-- Patch 5 — RR Distribuidora
-- Integração completa com estoque + nomes alinhados com dados.js
-- Execute no Supabase Dashboard → SQL Editor

-- ================================================================
-- 1. Renomear produtos existentes para coincidir com dados.js
-- ================================================================
UPDATE public.produtos SET nome='Cesta Simples 1kg'  WHERE nome='Cesta 1kg';
UPDATE public.produtos SET nome='Cesta Simples 2kg'  WHERE nome='Cesta 2kg';
UPDATE public.produtos SET nome='Cesta Simples 3kg'  WHERE nome='Cesta 3kg';
UPDATE public.produtos SET nome='Cesta Simples 4kg'  WHERE nome='Cesta 4kg';
UPDATE public.produtos SET nome='Cesta Simples 5kg'  WHERE nome='Cesta 5kg';
UPDATE public.produtos SET nome='Cesta Simples 6kg'  WHERE nome='Cesta 6kg';
UPDATE public.produtos SET nome='Cesta Simples 7kg'  WHERE nome='Cesta 7kg';
UPDATE public.produtos SET nome='Cesta Simples 8kg'  WHERE nome='Cesta 8kg';
UPDATE public.produtos SET nome='Cesta Simples 9kg'  WHERE nome='Cesta 9kg';
UPDATE public.produtos SET nome='Cesta Simples 10kg' WHERE nome='Cesta 10kg';
UPDATE public.produtos SET nome='Cesta Simples 11kg' WHERE nome='Cesta 11kg';

-- ================================================================
-- 2. Inserir produtos Completa e Especial (se não existirem)
-- ================================================================
INSERT INTO public.produtos (nome, descricao, preco, custo, estoque_atual, estoque_minimo, unidade, categoria) VALUES
  ('Cesta Completa 1kg',  'Cesta completa com maior variedade de produtos selecionados.', 160.00,115.00,30,8,'un','cesta'),
  ('Cesta Completa 2kg',  'Mais itens, mais qualidade para o dia a dia da sua família.',  180.00,129.00,25,8,'un','cesta'),
  ('Cesta Completa 3kg',  'Cesta reforçada com produtos de primeira linha.',               205.00,147.00,20,5,'un','cesta'),
  ('Cesta Completa 4kg',  'Variedade premium para abastecer a semana toda.',               225.00,162.00,20,5,'un','cesta'),
  ('Cesta Completa 5kg',  'Ideal para famílias que valorizam qualidade e variedade.',      250.00,180.00,15,5,'un','cesta'),
  ('Cesta Completa 6kg',  'Cesta completa com produtos alimentícios e de higiene.',        265.00,191.00,15,5,'un','cesta'),
  ('Cesta Completa 7kg',  'Abastecimento quinzenal com o melhor em qualidade.',            285.00,205.00,12,3,'un','cesta'),
  ('Cesta Completa 8kg',  'Para famílias de 4 a 5 pessoas com mais exigência.',            305.00,220.00,10,3,'un','cesta'),
  ('Cesta Completa 9kg',  'Ampla seleção dos melhores produtos do mercado.',               320.00,230.00,10,3,'un','cesta'),
  ('Cesta Completa 10kg', 'Abastecimento mensal premium para toda a família.',             340.00,245.00, 8,3,'un','cesta'),
  ('Cesta Completa 11kg', 'A cesta completa mais robusta da RR Distribuidora.',            360.00,259.00, 8,3,'un','cesta'),
  ('Cesta Popular',        'Cesta acessível com os produtos mais essenciais.',             100.00, 72.00,20,5,'un','especial'),
  ('Cesta Diferenciada',   'Cesta especial com produtos diferenciados.',                   260.00,187.00,10,3,'un','especial'),
  ('Cesta Montada',        'Cesta montada com critério, qualidade em cada item.',          390.00,281.00, 8,3,'un','especial'),
  ('Cesta Top RR',         'Nossa cesta premium. O máximo em qualidade e variedade.',      410.00,295.00, 5,2,'un','especial')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 3. Função RPC para decrementar estoque (SECURITY DEFINER)
--    Chamada pelo site público (role anon) com segurança
-- ================================================================
CREATE OR REPLACE FUNCTION public.decrementar_estoque_pedido(
  p_nome       TEXT,
  p_quantidade INTEGER,
  p_pedido_id  UUID,
  p_numero     TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id   UUID;
  v_est  INTEGER;
BEGIN
  -- Localiza produto pelo nome exato (case-insensitive)
  SELECT id, estoque_atual
    INTO v_id, v_est
    FROM public.produtos
   WHERE nome ILIKE p_nome
     AND ativo = TRUE
   LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE public.produtos
       SET estoque_atual = GREATEST(0, estoque_atual - p_quantidade)
     WHERE id = v_id;

    INSERT INTO public.estoque_movimentos
      (produto_id, pedido_id, tipo, quantidade, observacao)
    VALUES
      (v_id, p_pedido_id, 'saida', p_quantidade, 'Pedido #' || p_numero);
  END IF;
END;
$$;

-- Permite que o role anon chame a função
GRANT EXECUTE ON FUNCTION public.decrementar_estoque_pedido TO anon;

-- ================================================================
-- 4. Policy INSERT para entregas (admin pode criar sem entrega prévia)
-- ================================================================
DROP POLICY IF EXISTS "auth_insert_entregas" ON public.entregas;
CREATE POLICY "auth_insert_entregas" ON public.entregas
  FOR INSERT TO authenticated
  WITH CHECK (meu_papel() IN ('admin','logistica','montador'));
