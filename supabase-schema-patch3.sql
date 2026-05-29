-- Patch 3 — RR Distribuidora
-- Execute no Supabase Dashboard → SQL Editor

-- Adicionar colunas de timestamp na tabela entregas (se ainda não existirem)
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS saiu_em     TIMESTAMPTZ;
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMPTZ;

-- Inserir chaves ausentes na tabela configuracoes
INSERT INTO public.configuracoes (chave, valor) VALUES
  ('email',                   'contato@rrdistribuidora.com.br'),
  ('msg_whatsapp',            'Olá! Gostaria de confirmar meu pedido.'),
  ('comissao_vendedor_cesta', '20'),
  ('comissao_motoboy',        '14')
ON CONFLICT (chave) DO NOTHING;
