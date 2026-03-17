# Propostas de Implementação para a Demanda de Análise de Dados

## Objetivo

Este documento apresenta alternativas de implementação para atender uma demanda de **Análise de Dados** no sistema de gestão de estoque. As sugestões consideram a estrutura atual do projeto, o banco de dados existente e o nível de complexidade de cada abordagem.

O foco é evoluir o sistema para transformar os dados já coletados em **informação gerencial**, apoiando decisões sobre estoque, fornecedores, clientes e movimentações.

---

## Contexto atual do sistema

Hoje o sistema já registra dados suficientes para iniciar análises relevantes, principalmente nas tabelas:

- `movimentacao`: tipo (`entrada`/`saida`), produto, quantidade, local, parceiro, data/hora
- `produto`: descrição, quantidade, local
- `fornecedor`: dados cadastrais e status (`ativo`)
- `cliente`: dados cadastrais e status (`ativo`)
- `local_estoque`: locais de armazenamento

Com isso, já é possível gerar indicadores sem necessidade de remodelar totalmente o banco.

---

## Perguntas de negócio que podem ser atendidas

A demanda de análise de dados pode ser traduzida em perguntas como:

- Quais produtos têm maior saída?
- Quais produtos estão parados há muito tempo?
- Qual local de estoque movimenta mais itens?
- Quais fornecedores abastecem com maior frequência?
- Quais clientes concentram mais retiradas/saídas?
- Como evoluíram as entradas e saídas por período?
- Existem sinais de ruptura ou excesso de estoque?

Essas perguntas orientam as implementações sugeridas abaixo.

---

## Alternativa 1: Dashboard interno no próprio sistema

### Descrição
Criar uma nova tela no sistema, por exemplo `Análise de Dados` ou `Dashboard`, acessível pelo menu, exibindo indicadores e gráficos gerados a partir do próprio banco PostgreSQL.

### O que pode ser implementado

- Cards com indicadores principais:
  - total de entradas no período
  - total de saídas no período
  - produtos com maior movimentação
  - locais com maior volume movimentado
- Gráficos simples:
  - entradas x saídas por mês
  - top 10 produtos com maior saída
  - top fornecedores por volume de entrada
  - top clientes por volume de saída
- Filtros por:
  - período
  - produto
  - local
  - tipo de movimentação

### Como implementar

- Criar novas consultas SQL agregadas em `app.py`
- Criar uma rota como `/analise-dados`
- Renderizar os dados em template HTML com gráficos via JavaScript
- Biblioteca sugerida para gráficos:
  - `Chart.js` para solução simples e leve

### Vantagens

- Menor custo de implantação
- Mantém tudo dentro do sistema atual
- Fácil apresentação acadêmica e operacional
- Não depende de ferramenta externa

### Limitações

- Menor flexibilidade analítica do que uma ferramenta de BI
- Pode exigir mais manutenção no código Flask ao crescer

### Nível de esforço

- **Baixo a médio**

---

## Alternativa 2: Relatórios analíticos avançados em PDF e Excel

### Descrição
Expandir o módulo de relatórios já existente para incluir análises consolidadas, comparativas e resumidas.

### O que pode ser implementado

- Relatório de giro de estoque por produto
- Relatório de entradas por fornecedor
- Relatório de saídas por cliente
- Relatório por local de estoque
- Relatório por período com totais e comparativos
- Ranking de produtos mais movimentados
- Relação de produtos sem movimentação em determinado intervalo

### Como implementar

- Reaproveitar a estrutura de exportação atual em `PDF` e `Excel`
- Criar novos tipos de relatório no backend
- Adicionar agrupamentos e totais por categoria
- No Excel, incluir:
  - abas separadas por visão
  - gráficos automáticos
  - destaques por cor
  - totais consolidados

### Vantagens

- Aproveita a base já construída no sistema
- Excelente para entrega formal, auditoria e documentação
- Boa aderência para uso acadêmico e administrativo

### Limitações

- Menos interativo que um dashboard
- Exige gerar relatórios sempre que o usuário quiser explorar os dados

### Nível de esforço

- **Baixo a médio**

---

## Alternativa 3: Camada analítica com views SQL no PostgreSQL

### Descrição
Criar `views` ou `materialized views` no banco para centralizar indicadores analíticos, deixando a lógica de análise mais organizada e reutilizável.

### Exemplos de views

- `vw_movimentacao_mensal`
- `vw_top_produtos_saida`
- `vw_top_fornecedores_entrada`
- `vw_top_clientes_saida`
- `vw_saldo_por_local`
- `vw_produtos_sem_movimentacao`

### Como implementar

- Criar scripts SQL em `sql/` com as views
- Consumir essas views pelo Flask
- Opcionalmente usá-las também em relatórios e dashboards

### Vantagens

- Separa melhor a lógica analítica da aplicação
- Facilita manutenção e evolução
- Reaproveitável por várias interfaces
- Melhora clareza para futuras integrações com BI

### Limitações

- Exige organização adicional no banco
- Ainda depende de frontend ou relatório para visualização

### Nível de esforço

- **Médio**

---

## Alternativa 4: Integração com ferramenta de BI

### Descrição
Conectar o banco PostgreSQL do Neon a uma ferramenta de BI para construir dashboards interativos fora da aplicação.

### Ferramentas possíveis

- **Power BI**
- **Looker Studio**
- **Metabase**
- **Apache Superset**

### O que pode ser construído

- Painel executivo com KPIs
- Análises temporais por mês e por dia
- Curva ABC de produtos
- Fornecedores mais relevantes
- Clientes com maior consumo
- Mapas e análises por cidade/estado, se os dados forem explorados

### Vantagens

- Maior poder analítico
- Dashboards interativos com filtros avançados
- Melhor escalabilidade para análises futuras
- Boa solução para apresentações gerenciais

### Limitações

- Pode expor o banco a integrações externas se não for bem configurado
- Exige conhecimento da ferramenta escolhida
- Em alguns casos, pode haver custo ou limitação da versão gratuita

### Nível de esforço

- **Médio**

---

## Alternativa 5: Pipeline analítico com Python e Pandas

### Descrição
Criar scripts ou módulos analíticos em Python para processar os dados periodicamente e gerar arquivos, indicadores ou previsões.

### O que pode ser implementado

- Consolidação histórica de movimentações
- Cálculo de giro de estoque
- Identificação de sazonalidade
- Produtos com risco de ruptura
- Produtos com excesso de estoque
- Previsão simples de demanda

### Bibliotecas sugeridas

- `pandas`
- `numpy`
- `matplotlib` ou `plotly`
- `scikit-learn` (se houver previsão ou classificação)

### Vantagens

- Maior flexibilidade analítica
- Permite evoluir para análise preditiva
- Excelente para trabalhos com foco em ciência de dados

### Limitações

- Maior complexidade técnica
- Requer definição de rotina de execução
- Pode ser excessivo para uma primeira entrega, dependendo do escopo

### Nível de esforço

- **Médio a alto**

---

## Alternativa 6: Análise preditiva para apoio à reposição de estoque

### Descrição
Evolução da análise descritiva para sugerir ações futuras com base no histórico de consumo.

### Possibilidades

- sugestão de ponto de reposição
- previsão de demanda por produto
- alerta de tendência de ruptura
- recomendação de compra por período
- identificação de itens com baixa rotatividade

### Requisitos adicionais

- histórico consistente de movimentações
- janela temporal suficiente
- eventual inclusão de novos campos, como:
  - estoque mínimo
  - estoque máximo
  - lead time do fornecedor
  - custo unitário

### Vantagens

- Gera valor gerencial mais alto
- Aproxima o projeto de uma solução inteligente
- Diferencial relevante em apresentação acadêmica

### Limitações

- Exige mais maturidade dos dados
- Necessita calibragem e validação
- Não é a melhor primeira etapa se a demanda for de curto prazo

### Nível de esforço

- **Alto**

---

## Indicadores recomendados para este projeto

Independentemente da alternativa escolhida, os seguintes indicadores são aderentes ao sistema atual:

- **Total de entradas** por período
- **Total de saídas** por período
- **Saldo atual por produto e local**
- **Produtos mais movimentados**
- **Produtos sem movimentação**
- **Fornecedores com maior volume de entrada**
- **Clientes com maior volume de saída**
- **Locais com maior giro de estoque**
- **Movimentação mensal**
- **Percentual de transferências internas**

---

## Recomendação de implementação por fases

### Fase 1 — Entrega rápida e de baixo risco

Implementar:

- dashboard interno simples
- relatórios analíticos por período
- consultas agregadas diretamente no PostgreSQL

Essa fase já atende bem uma demanda inicial de análise de dados com baixo impacto estrutural.

### Fase 2 — Organização da camada analítica

Implementar:

- views SQL para indicadores
- expansão dos relatórios em Excel
- painel com rankings e comparativos

Essa fase melhora manutenção, clareza técnica e capacidade de evolução.

### Fase 3 — Evolução analítica

Implementar:

- integração com ferramenta de BI
- scripts com `pandas`
- análise preditiva para reposição e consumo

Essa fase é indicada se a demanda exigir maior profundidade analítica ou visão estratégica.

---

## Sugestão objetiva para este projeto

Considerando o estado atual do sistema, a melhor relação entre **valor entregue**, **tempo de desenvolvimento** e **aderência ao projeto** é:

1. **Criar um dashboard interno com KPIs e gráficos básicos**
2. **Expandir os relatórios PDF/Excel com visão analítica**
3. **Organizar consultas analíticas em views SQL**

Essa combinação permite atender a demanda de Análise de Dados sem depender inicialmente de uma arquitetura mais complexa.

---

## Conclusão

O sistema já possui base suficiente para iniciar uma camada de análise de dados relevante. A decisão entre as alternativas deve considerar o prazo, a profundidade esperada da análise e o objetivo da entrega.

Se a proposta for uma solução prática e viável no curto prazo, a melhor estratégia é começar com **análise descritiva e visualização gerencial**, evoluindo depois para BI externo ou modelos preditivos.
