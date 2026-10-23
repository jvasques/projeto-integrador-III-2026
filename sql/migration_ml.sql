-- Execute depois do schema existente. Não altera saldos nem movimentações.
CREATE TABLE IF NOT EXISTS planejamento_item (
    produto_id INTEGER PRIMARY KEY REFERENCES produto(id) ON DELETE RESTRICT,
    tipo TEXT NOT NULL CHECK (tipo IN ('produto', 'insumo')),
    unidade TEXT NOT NULL DEFAULT 'un',
    simulado BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS ficha_tecnica (
    produto_id INTEGER NOT NULL REFERENCES planejamento_item(produto_id) ON DELETE RESTRICT,
    insumo_id INTEGER NOT NULL REFERENCES planejamento_item(produto_id) ON DELETE RESTRICT,
    quantidade NUMERIC(14,4) NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (produto_id, insumo_id),
    CHECK (produto_id <> insumo_id)
);
CREATE INDEX IF NOT EXISTS idx_mov_demanda ON movimentacao (produto_descricao, created_at);
