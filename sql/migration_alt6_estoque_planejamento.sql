-- Migração para Alternativa 6 (análise preditiva)
-- Execute este script em bancos já existentes.

ALTER TABLE produto
    ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER;

ALTER TABLE produto
    ADD COLUMN IF NOT EXISTS estoque_maximo INTEGER;
