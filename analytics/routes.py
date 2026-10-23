"""Painel ML e cadastro da ficha técnica, usando a sessão do sistema existente."""
import csv
import io
import secrets
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from flask import Blueprint, abort, g, render_template, request, session, Response, redirect, url_for, flash
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .demand import forecast, plan

bp = Blueprint('planning', __name__)


@bp.before_request
def authorize():
    if 'user' not in session:
        return redirect(url_for('login'))
    session.setdefault('planning_csrf', secrets.token_hex(32))
    if request.method == 'POST' and not secrets.compare_digest(
            session['planning_csrf'], request.form.get('csrf', '')):
        abort(400, 'Formulário expirado. Recarregue a página.')


def items():
    return [dict(r) for r in g.db.execute(text('''
        SELECT i.produto_id AS id, i.tipo, i.unidade AS unit, i.simulado,
               p.descricao AS name, COALESCE(s.stock, 0) AS stock
        FROM planejamento_item i JOIN produto p ON p.id = i.produto_id
        LEFT JOIN (SELECT descricao, SUM(COALESCE(quantidade, 0)) AS stock
                   FROM produto GROUP BY descricao) s ON s.descricao = p.descricao
        ORDER BY p.descricao
    ''')).mappings()]


def build_report(horizon, window, source):
    today = date.today()
    catalog = [r for r in items() if bool(r['simulado']) == (source == 'simulado')]
    stocks = {r['id']: r for r in catalog}
    products = [r for r in catalog if r['tipo'] == 'produto']
    # Vendas brutas identificadas pelo legado: saída para cliente.
    # Transferências e devoluções de compra (saída para fornecedor) não são vendas.
    rows = g.db.execute(text('''
        SELECT produto_descricao, DATE(created_at) AS dia, SUM(quantidade) AS total
        FROM movimentacao WHERE tipo = 'saida' AND parceiro_tipo = 'cliente'
          AND quantidade > 0 AND created_at < :today
        GROUP BY produto_descricao, DATE(created_at)
    '''), {'today': today}).mappings()
    sales = {}
    for r in rows:
        day = r['dia'] if isinstance(r['dia'], date) else date.fromisoformat(r['dia'])
        sales.setdefault(r['produto_descricao'], {})[day] = r['total']
    recipes = {}
    for r in g.db.execute(text('SELECT * FROM ficha_tecnica')).mappings():
        if r['produto_id'] in stocks and r['insumo_id'] in stocks:
            recipes.setdefault(r['produto_id'], []).append((r['insumo_id'], r['quantidade']))
    for p in products:
        p['forecast'] = forecast(sales.get(p['name'], {}), today, horizon, window)
    materials = plan(products, recipes, stocks)
    return dict(products=products, materials=materials, today=today,
                end=today + timedelta(days=horizon - 1), horizon=horizon,
                window=window, source=source,
                missing=sum(p['forecast']['total'] is None for p in products),
                incomplete=sum(not p['has_recipe'] for p in products))


@bp.route('/dashboard/planejamento')
def dashboard():
    try:
        horizon = int(request.args.get('horizonte', 30))
        window = int(request.args.get('historico', 180))
        source = request.args.get('fonte', 'real')
        if horizon not in (7, 14, 30, 60, 90) or window not in (90, 180, 365) or source not in ('real', 'simulado'):
            raise ValueError()
    except ValueError:
        abort(400, 'Período ou fonte inválidos.')
    try:
        report = build_report(horizon, window, source)
    except SQLAlchemyError:
        g.db.rollback()
        return render_template('planejamento_setup.html'), 503
    if request.args.get('formato') == 'csv':
        buffer = io.StringIO()
        writer = csv.writer(buffer, delimiter=';')
        writer.writerow(['Fonte', source, 'Início', report['today'], 'Fim', report['end']])
        writer.writerow(['Produto', 'Saldo', 'Vendas previstas', 'Produzir', 'MAE', 'MAE referência', 'Ficha técnica'])
        def safe(value):
            s = str(value)
            return "'" + s if s.startswith(('=', '+', '-', '@', '\t', '\r')) else s
        for p in report['products']:
            f = p['forecast']
            writer.writerow([safe(p['name']), p['stock'], f['total'], p['produce'], f['mae'], f['baseline_mae'],
                             'Cadastrada' if p['has_recipe'] else 'Ausente'])
        writer.writerow([])
        writer.writerow(['Insumo', 'Unidade', 'Necessário', 'Saldo', 'Comprar'])
        for m in report['materials']:
            writer.writerow([safe(m['name']), safe(m['unit']), m['required'], m['stock'], m['buy']])
        return Response('\ufeff' + buffer.getvalue(), mimetype='text/csv; charset=utf-8',
                        headers={'Content-Disposition': 'attachment; filename=planejamento.csv'})
    return render_template('planejamento.html', **report)


@bp.route('/planejamento/fichas', methods=['GET', 'POST'])
def technical_sheets():
    try:
        if request.method == 'POST':
            try:
                action = request.form.get('action')
                pid = int(request.form['produto_id'])
                if action == 'item':
                    kind = request.form.get('tipo')
                    unit = request.form.get('unidade', '').strip()
                    if kind not in ('produto', 'insumo') or not unit or len(unit) > 20:
                        raise ValueError('Tipo ou unidade inválidos.')
                    # O primeiro registro de cada descrição é a identidade do cadastro legado.
                    canonical = g.db.execute(text('''SELECT MIN(id) FROM produto WHERE descricao =
                        (SELECT descricao FROM produto WHERE id = :id)'''), {'id': pid}).scalar()
                    if canonical != pid:
                        raise ValueError('Selecione um cadastro válido.')
                    old = g.db.execute(text('SELECT tipo FROM planejamento_item WHERE produto_id = :id'), {'id': pid}).scalar()
                    linked = g.db.execute(text('SELECT COUNT(*) FROM ficha_tecnica WHERE produto_id = :id OR insumo_id = :id'), {'id': pid}).scalar()
                    if old and old != kind and linked:
                        raise ValueError('Remova os vínculos da ficha antes de mudar o tipo.')
                    g.db.execute(text('''INSERT INTO planejamento_item (produto_id, tipo, unidade)
                        VALUES (:id, :tipo, :unidade) ON CONFLICT (produto_id) DO UPDATE
                        SET tipo = excluded.tipo, unidade = excluded.unidade'''),
                        {'id': pid, 'tipo': kind, 'unidade': unit})
                elif action in ('recipe', 'remove'):
                    mid = int(request.form['insumo_id'])
                    catalog = {r['id']: r for r in items()}
                    if (pid not in catalog or mid not in catalog or
                            catalog[pid]['tipo'] != 'produto' or catalog[mid]['tipo'] != 'insumo' or
                            catalog[pid]['simulado'] != catalog[mid]['simulado']):
                        raise ValueError('Selecione produto e insumo da mesma fonte.')
                    if action == 'remove':
                        g.db.execute(text('DELETE FROM ficha_tecnica WHERE produto_id = :p AND insumo_id = :i'), {'p': pid, 'i': mid})
                    else:
                        qty = Decimal(request.form.get('quantidade', '').replace(',', '.'))
                        if not qty.is_finite() or qty <= 0 or qty > Decimal('9999999999.9999') or qty != qty.quantize(Decimal('.0001')):
                            raise ValueError('Informe quantidade positiva com até quatro casas decimais.')
                        g.db.execute(text('''INSERT INTO ficha_tecnica (produto_id, insumo_id, quantidade)
                            VALUES (:p, :i, :q) ON CONFLICT (produto_id, insumo_id)
                            DO UPDATE SET quantidade = excluded.quantidade'''), {'p': pid, 'i': mid, 'q': str(qty)})
                else:
                    raise ValueError('Operação inválida.')
                g.db.commit()
                flash('Ficha técnica atualizada.', 'success')
            except (ValueError, InvalidOperation, KeyError) as exc:
                g.db.rollback()
                flash(str(exc) or 'Dados inválidos.', 'error')
            return redirect(url_for('planning.technical_sheets'))
        catalog = items()
        available = g.db.execute(text('SELECT MIN(id) AS id, descricao FROM produto GROUP BY descricao ORDER BY descricao')).mappings().all()
        recipes = g.db.execute(text('''SELECT f.*, p.descricao AS produto, i.descricao AS insumo
            FROM ficha_tecnica f JOIN produto p ON p.id = f.produto_id
            JOIN produto i ON i.id = f.insumo_id ORDER BY p.descricao, i.descricao''')).mappings().all()
        return render_template('fichas.html', catalog=catalog, available=available, recipes=recipes)
    except SQLAlchemyError:
        g.db.rollback()
        return render_template('planejamento_setup.html'), 503
