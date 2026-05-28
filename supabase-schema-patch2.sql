-- ================================================================
-- Patch 2 — RR Distribuidora
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Timestamps de fluxo na entrega
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS saiu_em     TIMESTAMPTZ;
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMPTZ;

-- Novos papéis: montador e motoboy
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_papel_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_papel_check
  CHECK (papel IN ('admin','vendedor','logistica','financeiro','montador','motoboy'));

-- Novas configurações de comissão e bairros
INSERT INTO public.configuracoes (chave, valor) VALUES
  ('comissao_motoboy',        '14.00'),
  ('comissao_vendedor_cesta', '20.00'),
  ('taxas_bairros', '[
    {"bairro":"Bomba do Hemetério","municipio":"Recife","taxa":5},
    {"bairro":"Av. Norte","municipio":"Recife","taxa":5},
    {"bairro":"Casa Amarela","municipio":"Recife","taxa":5},
    {"bairro":"Arruda","municipio":"Recife","taxa":5},
    {"bairro":"Nova Descoberta","municipio":"Recife","taxa":5},
    {"bairro":"Macaxeira","municipio":"Recife","taxa":5},
    {"bairro":"Boa Viagem","municipio":"Recife","taxa":5},
    {"bairro":"Pina","municipio":"Recife","taxa":5},
    {"bairro":"Torre","municipio":"Recife","taxa":5},
    {"bairro":"Ilha do Retiro","municipio":"Recife","taxa":5},
    {"bairro":"Sucupira","municipio":"Recife","taxa":5},
    {"bairro":"Barra de Jangada","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Muribeca","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Prazeres","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Candeias","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Cajueiro Seco","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Marcos Freire","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Jaboatão Centro","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Vila Rica","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Santo Aleixo","municipio":"Jaboatão dos Guararapes","taxa":10},
    {"bairro":"Olinda Centro","municipio":"Olinda","taxa":15},
    {"bairro":"Paulista","municipio":"Paulista","taxa":20},
    {"bairro":"Rio Doce","municipio":"Olinda","taxa":20},
    {"bairro":"São Lourenço da Mata","municipio":"São Lourenço da Mata","taxa":20},
    {"bairro":"Aldeia","municipio":"Camaragibe","taxa":20},
    {"bairro":"Ponte dos Carvalhos","municipio":"Cabo de Santo Agostinho","taxa":20},
    {"bairro":"Cabo de Santo Agostinho","municipio":"Cabo de Santo Agostinho","taxa":25},
    {"bairro":"Abreu e Lima","municipio":"Abreu e Lima","taxa":35},
    {"bairro":"Igarassu","municipio":"Igarassu","taxa":40}
  ]')
ON CONFLICT (chave) DO NOTHING;
