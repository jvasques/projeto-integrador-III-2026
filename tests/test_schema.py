import logging
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError

from analytics.schema import ensure_schema, SchemaInitializer


class SchemaTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://')
        with self.engine.begin() as db:
            db.execute(text('CREATE TABLE produto (id INTEGER PRIMARY KEY, quantidade INTEGER)'))
            db.execute(text('CREATE TABLE movimentacao (produto_descricao TEXT, created_at TEXT)'))
            db.execute(text('INSERT INTO produto VALUES (1, 27)'))

    def tearDown(self):
        self.engine.dispose()

    def test_create_twice_preserves_stock(self):
        ensure_schema(self.engine)
        ensure_schema(self.engine)
        self.assertTrue({'planejamento_item', 'ficha_tecnica'}.issubset(inspect(self.engine).get_table_names()))
        with self.engine.connect() as db:
            self.assertEqual(db.execute(text('SELECT quantidade FROM produto')).scalar(), 27)

    def test_failure_is_contained_and_retried(self):
        initializer = SchemaInitializer()
        logger = logging.getLogger('test_schema')
        with patch('analytics.schema.ensure_schema', side_effect=OperationalError('DDL', {}, Exception('denied'))) as call:
            self.assertFalse(initializer.ready(self.engine, logger))
            self.assertFalse(initializer.ready(self.engine, logger))
            self.assertEqual(call.call_count, 1)
        initializer.retry_at = 0
        self.assertTrue(initializer.ready(self.engine, logger))

    def test_success_cached_per_engine(self):
        initializer = SchemaInitializer()
        with patch('analytics.schema.ensure_schema') as call:
            self.assertTrue(initializer.ready(self.engine, logging.getLogger()))
            self.assertTrue(initializer.ready(self.engine, logging.getLogger()))
            self.assertEqual(call.call_count, 1)
