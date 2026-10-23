"""Preparação aditiva do planejamento no primeiro acesso autenticado."""
from pathlib import Path
from threading import Lock
from time import monotonic

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError


def ensure_schema(engine):
    """Transação independente: falhas não afetam a sessão das telas existentes."""
    with engine.begin() as connection:
        if connection.dialect.name == 'postgresql':
            connection.execute(text("SET LOCAL lock_timeout = '3s'"))
            connection.execute(text("SET LOCAL statement_timeout = '10s'"))
            # Serializa inicializações concorrentes, inclusive entre instâncias Vercel.
            connection.execute(text('SELECT pg_advisory_xact_lock(734202601)'))
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())
        if not {'produto', 'movimentacao'}.issubset(tables):
            raise RuntimeError('O banco deve conter o schema original do sistema.')
        if {'planejamento_item', 'ficha_tecnica'}.issubset(tables):
            indexes = inspector.get_indexes('movimentacao')
            if any(index['name'] == 'idx_mov_demanda' for index in indexes):
                return
        sql = (Path(__file__).resolve().parent.parent / 'sql' / 'migration_ml.sql').read_text(encoding='utf-8')
        sql = '\n'.join(line for line in sql.splitlines() if not line.lstrip().startswith('--'))
        for statement in sql.split(';'):
            if statement.strip():
                connection.execute(text(statement))


class SchemaInitializer:
    def __init__(self):
        self.lock = Lock()
        self.ready_engine = None
        self.retry_at = 0

    def ready(self, engine, logger):
        with self.lock:
            if engine is not None and self.ready_engine is engine:
                return True
            if monotonic() < self.retry_at:
                return False
            try:
                ensure_schema(engine)
            except (SQLAlchemyError, RuntimeError, OSError, AttributeError):
                # Não inclui SQL, URL de conexão nem credenciais no log.
                logger.warning('Não foi possível preparar as tabelas de planejamento. Verifique conexão e permissão de criação.')
                self.retry_at = monotonic() + 60
                return False
            self.ready_engine = engine
            self.retry_at = 0
            return True
