-- Patch 6 — RR Distribuidora
-- Estoque de ingredientes: produtos = insumos das cestas
-- Execute no Supabase Dashboard → SQL Editor

-- ================================================================
-- 1. Desativar cestas no estoque (estoque controla ingredientes)
-- ================================================================
UPDATE public.produtos SET ativo = FALSE
WHERE categoria IN ('cesta','especial');

-- ================================================================
-- 2. Inserir os 19 ingredientes (insumos das cestas)
--    custo = preço médio de compra; preco = referência de mercado
-- ================================================================
INSERT INTO public.produtos (nome, descricao, preco, custo, estoque_atual, estoque_minimo, unidade, categoria) VALUES
  ('Arroz 5kg',                 'Arroz branco 5kg',             22.00, 18.50, 200, 50, 'un', 'alimento'),
  ('Feijão 1kg',                'Feijão carioca 1kg',           10.00,  7.80, 200, 50, 'un', 'alimento'),
  ('Açúcar 2kg',                'Açúcar cristal 2kg',            9.00,  7.00, 200, 50, 'un', 'alimento'),
  ('Sal 1kg',                   'Sal refinado 1kg',              3.50,  2.50, 200, 50, 'un', 'alimento'),
  ('Óleo de Soja 900ml',        'Óleo de soja 900ml',           10.00,  8.20, 200, 50, 'un', 'alimento'),
  ('Farinha de Trigo 1kg',      'Farinha de trigo 1kg',          5.00,  3.80, 150, 40, 'un', 'alimento'),
  ('Macarrão 500g',             'Macarrão espaguete 500g',       4.50,  3.20, 150, 40, 'un', 'alimento'),
  ('Molho de Tomate 340g',      'Molho de tomate 340g',          4.00,  2.90, 150, 40, 'un', 'alimento'),
  ('Sardinha 125g',             'Sardinha em óleo 125g',         6.50,  5.00, 100, 30, 'un', 'alimento'),
  ('Café 250g',                 'Café torrado e moído 250g',     9.00,  7.00, 100, 30, 'un', 'alimento'),
  ('Biscoito Cream Cracker 400g','Biscoito cream cracker 400g',  6.00,  4.50, 100, 30, 'un', 'alimento'),
  ('Leite em Pó 400g',          'Leite em pó 400g',            18.00, 14.00, 100, 30, 'un', 'alimento'),
  ('Achocolatado 400g',         'Achocolatado em pó 400g',     14.00, 10.50, 100, 30, 'un', 'alimento'),
  ('Sabão em Pó 1kg',           'Sabão em pó 1kg',             12.00,  9.00, 100, 30, 'un', 'limpeza'),
  ('Amaciante 500ml',           'Amaciante de roupas 500ml',     8.00,  6.00, 100, 30, 'un', 'limpeza'),
  ('Detergente 500ml',          'Detergente líquido 500ml',      3.50,  2.50, 100, 30, 'un', 'limpeza'),
  ('Papel Higiênico 4un',       'Papel higiênico 4 rolos',       8.00,  6.00, 100, 30, 'un', 'limpeza'),
  ('Creme Dental',              'Creme dental 90g',              4.50,  3.20,  80, 20, 'un', 'higiene'),
  ('Sabonete',                  'Sabonete 90g',                  3.00,  2.00,  80, 20, 'un', 'higiene')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 3. Função RPC para decrementar INGREDIENTES por pedido
--    Recebe array dos nomes dos itens selecionados pelo cliente
-- ================================================================
CREATE OR REPLACE FUNCTION public.decrementar_ingredientes_pedido(
  p_itens      TEXT[],   -- nomes dos ingredientes selecionados
  p_quantidade INTEGER,  -- qtd de cestas (multiplica o desconto)
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
     WHERE nome ILIKE v_nome
       AND ativo = TRUE
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

-- Mantém a função anterior por compatibilidade
DROP FUNCTION IF EXISTS public.decrementar_estoque_pedido(TEXT, INTEGER, UUID, TEXT);
