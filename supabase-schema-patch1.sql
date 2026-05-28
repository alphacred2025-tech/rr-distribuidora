-- ================================================================
-- Patch 1 — RR Distribuidora
-- Adiciona timestamps de saída/entrega e comissão motoboy
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Timestamps de fluxo na entrega
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS saiu_em     TIMESTAMPTZ;
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMPTZ;
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS obs_cancelamento TEXT;

-- Configuração: comissão fixa do motoboy por entrega
INSERT INTO public.configuracoes (chave, valor)
VALUES ('comissao_motoboy', '14.00')
ON CONFLICT (chave) DO NOTHING;
