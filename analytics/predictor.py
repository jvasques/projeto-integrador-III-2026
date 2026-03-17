import math


def _to_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def _to_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


def calcular_metricas_reposicao(saldo_atual, total_saida_periodo, dias_periodo, estoque_minimo=None):
    dias_periodo = max(_to_int(dias_periodo, 1), 1)
    saldo_atual = _to_int(saldo_atual, 0)

    total_saida = _to_float(total_saida_periodo, 0.0)
    consumo_diario_medio = total_saida / dias_periodo

    ponto_reposicao_estimado = int(math.ceil(consumo_diario_medio * 7))
    previsao_30_dias = int(math.ceil(consumo_diario_medio * 30))

    minimo = _to_int(estoque_minimo, 0)
    if minimo <= 0:
        minimo = ponto_reposicao_estimado

    if minimo < 0:
        minimo = 0

    alvo_estoque = int(math.ceil(minimo * 1.2)) if minimo > 0 else previsao_30_dias
    if alvo_estoque < minimo:
        alvo_estoque = minimo

    sugestao_compra = max(0, alvo_estoque - saldo_atual)

    if saldo_atual <= minimo:
        criticidade = 'critico'
    elif saldo_atual <= int(minimo * 1.2):
        criticidade = 'atencao'
    else:
        criticidade = 'ok'

    return {
        'saldo_atual': saldo_atual,
        'ponto_reposicao': minimo,
        'alvo_estoque': alvo_estoque,
        'sugestao_compra': sugestao_compra,
        'criticidade': criticidade,
    }
