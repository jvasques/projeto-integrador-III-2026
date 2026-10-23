"""Dados reproduzíveis e isolados por cadastros DEMO. Apenas execução explícita."""
from datetime import date, datetime, time, timedelta
import random

import click
from sqlalchemy import text


def seed_demo(db, today=None, days=180):
    today = today or date.today()
    if db.execute(text("SELECT COUNT(*) FROM produto WHERE descricao LIKE '[DEMO ML] %'")).scalar():
        raise ValueError('Demonstração já existe. Nenhum dado foi alterado.')
    rng = random.Random(2026)
    definitions = [('Caixa A', 'produto', 'un', 20), ('Caixa B', 'produto', 'un', 12),
                   ('Chapa', 'insumo', 'un', 45), ('Parafuso', 'insumo', 'un', 150)]
    ids = []
    local = '[DEMO ML] Depósito'
    if not db.execute(text('SELECT id FROM local_estoque WHERE nome = :n'), {'n': local}).first():
        db.execute(text('INSERT INTO local_estoque (nome, descricao) VALUES (:n, :d)'),
                   {'n': local, 'd': 'Dados simulados para demonstração acadêmica'})
    client = db.execute(text('INSERT INTO cliente (nome, documento) VALUES (:n, :d) RETURNING id'),
                        {'n': '[DEMO ML] Cliente fictício', 'd': 'SIMULADO-2026'}).scalar_one()
    for index, (name, kind, unit, stock) in enumerate(definitions):
        name = '[DEMO ML] ' + name
        pid = db.execute(text('INSERT INTO produto (descricao, quantidade, local) VALUES (:n, :q, :l) RETURNING id'),
                         {'n': name, 'q': stock, 'l': local}).scalar_one()
        ids.append(pid)
        db.execute(text('INSERT INTO planejamento_item (produto_id, tipo, unidade, simulado) VALUES (:p, :t, :u, TRUE)'),
                   {'p': pid, 't': kind, 'u': unit})
        movements = []
        if kind == 'produto':
            for i in range(days):
                day = today - timedelta(days=days - i)
                qty = max(0, round((6 + index * 3 + i * .025) * (1.6 if day.weekday() < 5 else .4) + rng.gauss(0, 1.5)))
                if qty:
                    movements.append(dict(t='saida', p=pid, n=name, q=qty, l=local,
                                           partner=client, pt='cliente', d=datetime.combine(day, time(12))))
        # Entrada inicial cobre todas as saídas, conciliando o saldo atual.
        opening = stock + sum(m['q'] for m in movements)
        movements.insert(0, dict(t='entrada', p=pid, n=name, q=opening, l=local,
                                 partner=None, pt='fornecedor', d=datetime.combine(today - timedelta(days=days), time(8))))
        db.execute(text('''INSERT INTO movimentacao
            (tipo, produto_id, produto_descricao, quantidade, local, parceiro_id, parceiro_tipo, created_at)
            VALUES (:t, :p, :n, :q, :l, :partner, :pt, :d)'''), movements)
    for pid, chapa, parafuso in [(ids[0], '0.5', '4'), (ids[1], '0.8', '6')]:
        for mid, qty in [(ids[2], chapa), (ids[3], parafuso)]:
            db.execute(text('INSERT INTO ficha_tecnica VALUES (:p, :i, :q)'), {'p': pid, 'i': mid, 'q': qty})


def register_demo_command(app, engine):
    @app.cli.command('gerar-demo-ml')
    @click.option('--confirmar-banco-desenvolvimento', is_flag=True,
                  help='Confirma que DATABASE_URL aponta para banco de desenvolvimento.')
    def generate(confirmar_banco_desenvolvimento):
        """Insere 180 dias fictícios. Nunca executado na inicialização do servidor."""
        if not confirmar_banco_desenvolvimento:
            raise click.ClickException('Use --confirmar-banco-desenvolvimento em um banco de testes.')
        if engine is None:
            raise click.ClickException('Configure DATABASE_URL primeiro.')
        try:
            with engine.begin() as db:
                seed_demo(db)
        except ValueError as exc:
            raise click.ClickException(str(exc)) from exc
        click.echo('Demonstração criada: 180 dias, 2 produtos, 2 insumos. Selecione a fonte simulada no painel.')
