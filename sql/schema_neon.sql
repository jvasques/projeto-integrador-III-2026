-- Schema PostgreSQL compatível com Neon (Postgres 15+)
-- Ajuste tipos conforme necessário; use SERIAL para chaves simples.

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS empresa (
  id SERIAL PRIMARY KEY,
  cnpj TEXT,
  razao_social TEXT,
  nome_fantasia TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  cep TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  telefone TEXT
);

CREATE TABLE IF NOT EXISTS fornecedor (
  id SERIAL PRIMARY KEY,
  cnpj TEXT,
  razao_social TEXT,
  nome_fantasia TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  cep TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  telefone TEXT,
  representante TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cliente (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  documento TEXT NOT NULL,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  cep TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS local_estoque (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT
);

-- Nota: A tabela produto é usada tanto para cadastro (descricao única) quanto para saldos por local.
-- Mantemos o modelo atual (possui linhas por local também), com colunas opcionais.
CREATE TABLE IF NOT EXISTS produto (
  id SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  quantidade INTEGER,
  local TEXT,
  estoque_minimo INTEGER,
  estoque_maximo INTEGER
);
CREATE INDEX IF NOT EXISTS idx_produto_desc ON produto (descricao);
CREATE INDEX IF NOT EXISTS idx_produto_local ON produto (local);

CREATE TABLE IF NOT EXISTS movimentacao (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  produto_id INTEGER,
  produto_descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  local TEXT,
  parceiro_id INTEGER,
  parceiro_tipo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_movimentacao_tipo ON movimentacao (tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacao_created_at ON movimentacao (created_at);

-- Dados iniciais
INSERT INTO usuarios (username, password, role) VALUES ('admin', 'admin', 'admin')
ON CONFLICT (username) DO NOTHING;
