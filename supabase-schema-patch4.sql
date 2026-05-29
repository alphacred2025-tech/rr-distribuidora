-- Patch 4 — RR Distribuidora
-- Execute no Supabase Dashboard → SQL Editor

-- 1. Ampliar papéis aceitos em profiles (inclui montador e motoboy)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_papel_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_papel_check
  CHECK (papel IN ('admin','vendedor','logistica','financeiro','montador','motoboy'));

-- 2. Garantir coluna obs_cancelamento na tabela entregas
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS obs_cancelamento TEXT;

-- 3. Garantir coluna saiu_em / entregue_em (já pode existir)
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS saiu_em     TIMESTAMPTZ;
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMPTZ;
