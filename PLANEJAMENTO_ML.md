# Planejamento de vendas, produção e insumos

## Preparação automática em banco existente

Após a publicação, o primeiro acesso autenticado ao Planejamento com IA cria
automaticamente as duas tabelas e o índice de `sql/migration_ml.sql`, usando a
conexão já configurada no site. Não é preciso executar o SQL manualmente se o
usuário do banco tiver permissão de criação. O banco original deve existir.
A rotina é aditiva, transacional e repetível; não apaga dados nem gera exemplos.
No PostgreSQL, um bloqueio transacional coordena instâncias concorrentes, com
limites de espera e execução. Em falha, somente o novo painel retorna erro 503;
uma nova tentativa é permitida após um minuto. As rotas antigas não executam
essa preparação. Um banco novo ainda exige o schema original descrito abaixo.

## Preparar e executar

1. Use um banco PostgreSQL de **desenvolvimento**, separado do banco em uso.
2. Instale `pip install -r requirements.txt` no ambiente virtual.
3. Configure `DATABASE_URL` e `SECRET_KEY` no `.env`, conforme o README.
4. Em um banco novo, execute `sql/schema_neon.sql`. Em qualquer banco, execute também `sql/migration_ml.sql`. A migração é repetível e não modifica saldos existentes.
5. Opcionalmente, gere a demonstração: `flask --app app gerar-demo-ml --confirmar-banco-desenvolvimento`.
6. Execute `python app.py`, entre no sistema e abra **Planejamento com IA** (`/dashboard/planejamento`). Selecione **Demonstração simulada** para os exemplos.
7. Para cadastros próprios: cadastre produtos acabados e insumos em Produtos; registre seus saldos em Movimentações; classifique cada cadastro e informe sua composição em **Editar fichas técnicas**.

O painel calcula sugestões sem executar produção, compras ou baixas. Revise as quantidades e registre operações pelos fluxos existentes. O relatório CSV conserva os filtros de fonte, horizonte e histórico. Relatórios históricos PDF/Excel continuam disponíveis em Movimentações.

## Modelo e avaliação

- Machine Learning supervisionado: `sklearn.linear_model.Ridge`, regularização alpha=1, tendência temporal e sete indicadores do dia da semana. Treinado por produto, sob demanda, com bibliotecas gratuitas; não requer API de IA nem chave paga.
- Alvo: quantidade diária de vendas brutas, definida no legado por `tipo='saida'` e `parceiro_tipo='cliente'`. Entradas, transferências e devoluções a fornecedores não são demanda. Devoluções de clientes não são descontadas do alvo.
- Hoje é excluído do treino por ser um dia incompleto. A previsão começa hoje e abrange 7, 14, 30, 60 ou 90 dias.
- Janela de até 90, 180 ou 365 dias. Dias sem venda após a primeira venda conhecida viram zero. Antes da primeira observação não são inventados zeros. Exige ao menos 42 dias e sete dias com vendas positivas.
- Avaliação cronológica: separa o bloco final de `min(horizonte, dias_disponiveis // 3)` dias; ajusta somente no bloco anterior, calcula MAE diário e compara com a repetição da última semana conhecida. Depois refaz o ajuste com todo o histórico para projetar o futuro.
- O erro é de um único bloco de teste, não uma estimativa robusta de desempenho em produção. A referência não escolhe automaticamente outro modelo; o painel alerta quando Ridge é pior. Não são fornecidos intervalos de confiança ou promessa de precisão.
- `produzir = max(0, ceil(soma das previsões diárias) - saldo do produto)`.
- `necessidade do insumo = soma(produzir × consumo por unidade)` de todos os produtos. Somente depois se desconta o saldo do insumo uma vez. Compras são arredondadas para cima.

Referências técnicas: [Ridge](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Ridge.html) e [avaliação de séries temporais](https://scikit-learn.org/stable/modules/cross_validation.html#time-series-split).

## Dados simulados

O comando insere dois produtos, dois insumos compartilhados, quatro vínculos de ficha técnica, cliente e local fictícios e 180 dias de vendas com tendência, sazonalidade semanal e ruído reproduzível (semente 2026). Entradas iniciais conciliam o total vendido com os saldos finais; são exemplos de abertura de estoque, não ordens de produção executadas. Todos os cadastros usam o prefixo `[DEMO ML]` e a classificação `simulado`.

O painel separa fontes reais e simuladas. As telas legadas de estoque e movimentação continuam mostrando os cadastros DEMO, por isso o comando deve ser executado em banco de desenvolvimento. Ele recusa uma segunda execução e usa transação única. Nunca é executado na inicialização ou por uma visita ao dashboard. Para recomeçar, use outro banco de testes.

## Integração e limites

- Mantido Flask, SQLAlchemy, PostgreSQL, Bootstrap e o estoque legado. A análise anterior de reposição continua disponível.
- `planejamento_item` referencia o primeiro registro da descrição em `produto`. A descrição continua agrupando saldos por local; evite duplicar nomes de produtos distintos. A ficha usa IDs e preserva vínculos ao renomear. O histórico também é atualizado quando a descrição muda.
- O estoque legado aceita somente inteiros; use gramas, mililitros ou outra unidade indivisível para materiais fracionados. A ficha admite quatro casas decimais. Não há conversão automática de unidades; mantenha a mesma unidade entre saldo e consumo. Não troque a unidade de itens com saldo sem converter os dados manualmente.
- Ficha de um nível: produto acabado consome insumo, sem fabricação intermediária. Não se misturam fontes real e simulada na mesma ficha.
- Sem ficha ou histórico suficiente, o plano de compras é explicitamente parcial.
- Não considera prazo de reposição, capacidade de produção, reservas, perdas, rupturas, promoções nem custos unitários. Portanto não calcula economia financeira nem garante redução de custo.
- Antes de uso real: auditar classificação das movimentações, completar os registros diários, padronizar fuso horário da aplicação/banco e validar com dados reais e vários cortes temporais. Ausência de venda pode significar falta de estoque, e o modelo não distingue isso.
- O modelo é treinado a cada consulta e não é persistido; adequado ao volume acadêmico. Avaliar cache/treinamento agendado e limites de execução/pacote antes de publicar no ambiente serverless Vercel.

## Verificação

Execute `python -m unittest discover -s tests -v` na raiz. Os testes usam banco SQLite temporário para exercitar rotas e SQL básico; não substituem a execução da migração e validação no PostgreSQL/Neon. Incluem corte temporal, exclusão do futuro, dados insuficientes, zeros, insumos compartilhados, arredondamento, autenticação, CSRF, fonte simulada, conciliação e exportação.
