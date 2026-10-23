import os
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

os.environ.pop('DATABASE_URL', None)
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import app as main
from analytics.demand import forecast, plan
from analytics.demo import seed_demo
from analytics.routes import build_report
from flask import g


class ForecastTests(unittest.TestCase):
    def test_temporal_holdout_and_future_exclusion(self):
        today = date(2026, 9, 30)
        sales = {today - timedelta(days=i): 10 for i in range(1, 101)}
        expected = forecast(sales, today)
        sales[today] = 100000
        sales[today + timedelta(days=1)] = 100000
        self.assertEqual(expected, forecast(sales, today))
        self.assertAlmostEqual(expected['mae'], 0)
        self.assertEqual(expected['total'], 300)
        self.assertEqual(expected['test_days'], 30)

    def test_insufficient_and_zero_days(self):
        today = date(2026, 9, 30)
        self.assertIsNone(forecast({}, today)['total'])
        f = forecast({today - timedelta(days=50): 3}, today)
        self.assertEqual(len(f['history']), 50)
        self.assertEqual(f['history'][1]['value'], 0)
        self.assertIsNone(f['total'])

    def test_test_targets_do_not_leak_into_predictions(self):
        today = date(2026, 9, 30)
        sales = {today - timedelta(days=i): 10 + i % 7 for i in range(1, 121)}
        first = forecast(sales, today)
        for i in range(1, 31):
            sales[today - timedelta(days=i)] = 1000
        second = forecast(sales, today)
        self.assertEqual([r['predicted'] for r in first['validation']],
                         [r['predicted'] for r in second['validation']])
        self.assertNotEqual(first['mae'], second['mae'])

    def test_shared_material_and_fraction_rounding(self):
        products = [dict(id=1, stock=5, forecast={'total': 15}),
                    dict(id=2, stock=0, forecast={'total': 10})]
        materials = plan(products, {1: [(3, '.25')], 2: [(3, '.5')]},
                         {3: dict(stock=3, name='Chapa', unit='un')})
        self.assertEqual(materials[0]['required'], 7.5)
        self.assertEqual(materials[0]['buy'], 5)

    def test_no_production_when_stock_covers_sales(self):
        products = [dict(id=1, stock=50, forecast={'total': 15})]
        self.assertEqual(plan(products, {}, {}), [])
        self.assertEqual(products[0]['produce'], 0)


class IntegrationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.engine = create_engine('sqlite:///' + self.tmp.name + '/test.db')
        schema = Path('sql/schema_neon.sql').read_text(encoding='utf-8').replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY').replace('DEFAULT now()', 'DEFAULT CURRENT_TIMESTAMP')
        migration = Path('sql/migration_ml.sql').read_text(encoding='utf-8')
        with self.engine.begin() as db:
            sql = '\n'.join(line for line in (schema + '\n' + migration).splitlines() if not line.lstrip().startswith('--'))
            for statement in sql.split(';'):
                if statement.strip():
                    db.execute(text(statement))
        main.SessionLocal = sessionmaker(bind=self.engine)
        main.app.config.update(TESTING=True, SECRET_KEY='testing')
        self.client = main.app.test_client()

    def tearDown(self):
        self.engine.dispose()
        self.tmp.cleanup()

    def login(self):
        with self.client.session_transaction() as s:
            s['user'] = {'username': 'tester', 'role': 'user'}
            s['planning_csrf'] = 'token'

    def test_demo_balances_idempotence_and_dashboard(self):
        with self.engine.begin() as db:
            seed_demo(db)
            for row in db.execute(text('''SELECT p.quantidade, SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END) AS saldo
                FROM produto p JOIN movimentacao m ON m.produto_id = p.id GROUP BY p.id''')).mappings():
                self.assertEqual(row['quantidade'], row['saldo'])
            with self.assertRaises(ValueError):
                seed_demo(db)
        self.login()
        result = self.client.get('/dashboard/planejamento?fonte=simulado')
        self.assertEqual(result.status_code, 200)
        self.assertIn('DEMONSTRAÇÃO'.encode(), result.data)
        self.assertIn(b'Regress', result.data)
        self.assertNotIn(b'Caixa A', self.client.get('/dashboard/planejamento').data)
        csv = self.client.get('/dashboard/planejamento?fonte=simulado&formato=csv')
        self.assertEqual(csv.status_code, 200)
        self.assertIn(b'Comprar', csv.data)

    def test_auth_input_validation_and_csrf(self):
        self.assertEqual(self.client.get('/dashboard/planejamento').status_code, 302)
        self.login()
        self.assertEqual(self.client.get('/dashboard/planejamento?horizonte=-1').status_code, 400)
        self.assertEqual(self.client.post('/planejamento/fichas', data={}).status_code, 400)

    def test_recipe_ui_and_invalid_quantity(self):
        with self.engine.begin() as db:
            seed_demo(db)
            ids = list(db.execute(text('SELECT produto_id FROM planejamento_item ORDER BY produto_id')).scalars())
        self.login()
        self.assertEqual(self.client.get('/planejamento/fichas').status_code, 200)
        data = dict(csrf='token', action='recipe', produto_id=ids[0], insumo_id=ids[2], quantidade='NaN')
        self.assertEqual(self.client.post('/planejamento/fichas', data=data).status_code, 302)
        with self.engine.connect() as db:
            self.assertEqual(float(db.execute(text('SELECT quantidade FROM ficha_tecnica WHERE produto_id=:p AND insumo_id=:i'), {'p': ids[0], 'i': ids[2]}).scalar()), .5)

    def test_transfers_and_supplier_returns_do_not_change_forecast(self):
        with self.engine.begin() as db:
            seed_demo(db)
        with main.app.test_request_context():
            g.db = main.SessionLocal()
            before = build_report(30, 180, 'simulado')
            for partner in ('transferencia', 'fornecedor'):
                g.db.execute(text('''INSERT INTO movimentacao
                    (tipo, produto_descricao, quantidade, parceiro_tipo, created_at)
                    VALUES ('saida', '[DEMO ML] Caixa A', 999999, :p, :d)'''),
                    {'p': partner, 'd': date.today() - timedelta(days=1)})
            after = build_report(30, 180, 'simulado')
            self.assertEqual(before['products'], after['products'])
            g.db.rollback()
            g.db.close()

    def test_valid_recipe_update_and_remove(self):
        with self.engine.begin() as db:
            seed_demo(db)
            ids = list(db.execute(text('SELECT produto_id FROM planejamento_item ORDER BY produto_id')).scalars())
        self.login()
        data = dict(csrf='token', action='recipe', produto_id=ids[0], insumo_id=ids[2], quantidade='1.25')
        self.client.post('/planejamento/fichas', data=data)
        with self.engine.connect() as db:
            self.assertEqual(float(db.execute(text('SELECT quantidade FROM ficha_tecnica WHERE produto_id=:p AND insumo_id=:i'), {'p': ids[0], 'i': ids[2]}).scalar()), 1.25)
        data['action'] = 'remove'
        self.client.post('/planejamento/fichas', data=data)
        with self.engine.connect() as db:
            self.assertIsNone(db.execute(text('SELECT quantidade FROM ficha_tecnica WHERE produto_id=:p AND insumo_id=:i'), {'p': ids[0], 'i': ids[2]}).scalar())


if __name__ == '__main__':
    unittest.main()
