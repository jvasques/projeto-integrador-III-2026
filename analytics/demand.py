"""Previsão diária com corte temporal; não usa dados futuros como atributos."""
from datetime import timedelta
from decimal import Decimal, ROUND_CEILING
import math

import numpy as np
from sklearn.linear_model import Ridge


def features(days, origin):
    return [[(d - origin).days / 365, *[int(d.weekday() == w) for w in range(7)]] for d in days]


def forecast(sales, today, horizon=30, window=180):
    """sales: dict(date -> quantidade). Hoje fica excluído por estar incompleto.

    Dias sem vendas após a primeira observação são zeros. Nunca se inventa
    histórico anterior à primeira venda. O teste cobre o horizonte solicitado
    (limitado a 1/3 da série) e não participa do ajuste avaliado.
    """
    if horizon not in (7, 14, 30, 60, 90) or window not in (90, 180, 365):
        raise ValueError('Período inválido.')
    sales = {d: max(0, float(v)) for d, v in sales.items() if d < today}
    future = [today + timedelta(days=i) for i in range(horizon)]
    result = dict(status='insuficiente', model='Sem previsão', total=None,
                  history=[], projection=[], mae=None, baseline_mae=None, test_days=0)
    if not sales:
        return result
    start = max(min(sales), today - timedelta(days=window))
    days = [start + timedelta(days=i) for i in range((today - start).days)]
    y = np.array([sales.get(d, 0) for d in days])
    result['history'] = [{'date': d.isoformat(), 'value': float(v)} for d, v in zip(days, y)]
    if len(days) < 42 or np.count_nonzero(y) < 7:
        return result
    test_size = min(horizon, len(days) // 3)
    split = len(days) - test_size
    model = Ridge(alpha=1.0)
    model.fit(features(days[:split], start), y[:split])
    predicted = np.maximum(0, model.predict(features(days[split:], start)))
    # Referência sazonal: repete a última semana conhecida, sem atualização no teste.
    baseline = np.array([y[split - 7 + i % 7] for i in range(test_size)])
    mae = float(np.mean(np.abs(y[split:] - predicted)))
    baseline_mae = float(np.mean(np.abs(y[split:] - baseline)))
    model.fit(features(days, start), y)
    projection = np.maximum(0, model.predict(features(future, start)))
    result.update(status='ok', model='Regressão Ridge (tendência e dia da semana)',
                  total=math.ceil(float(projection.sum())), mae=round(mae, 3),
                  baseline_mae=round(baseline_mae, 3), test_days=test_size,
                  projection=[{'date': d.isoformat(), 'value': round(float(v), 3)}
                              for d, v in zip(future, projection)],
                  validation=[{'date': d.isoformat(), 'actual': float(v), 'predicted': round(float(p), 3)}
                              for d, v, p in zip(days[split:], y[split:], predicted)])
    return result


def plan(products, recipes, stocks):
    """Agrega insumos compartilhados ANTES de descontar o saldo, uma única vez."""
    needs = {}
    for product in products:
        pid = product['id']
        total = product['forecast']['total']
        product['produce'] = None if total is None else max(0, total - int(product['stock']))
        product['has_recipe'] = bool(recipes.get(pid))
        for material, quantity in recipes.get(pid, []):
            if product['produce'] is not None:
                needs[material] = needs.get(material, Decimal(0)) + Decimal(str(quantity)) * product['produce']
    materials = []
    for mid, required in sorted(needs.items()):
        # Estoque legado é inteiro: comprar unidades inteiras, arredondando para cima.
        stock = Decimal(str(stocks[mid]['stock']))
        buy = max(Decimal(0), required - stock).to_integral_value(rounding=ROUND_CEILING)
        materials.append(dict(id=mid, name=stocks[mid]['name'], unit=stocks[mid]['unit'],
                              required=float(required), stock=float(stock), buy=int(buy)))
    return materials
