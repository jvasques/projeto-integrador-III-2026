# Relatório de Acessibilidade do Sistema

Este documento descreve as leis, normas e boas práticas de acessibilidade adotadas no sistema, e como elas foram implementadas no código.

## Referências legais e normativas adotadas

- Lei Brasileira de Inclusão da Pessoa com Deficiência (LBI) – Lei nº 13.146/2015
  - Estabelece diretrizes gerais de acessibilidade, comunicação e tecnologias assistivas.
- Lei nº 10.436/2002 e Decreto nº 5.626/2005 (Libras)
  - Reconhece a Língua Brasileira de Sinais e incentiva sua difusão; fundamenta o uso de recursos como o VLibras.
- WCAG 2.1 (W3C Web Content Accessibility Guidelines)
  - Diretrizes internacionais com critérios de sucesso: Perceptível, Operável, Compreensível e Robusto.
- eMAG (Modelo de Acessibilidade em Governo Eletrônico)
  - Guia brasileiro com recomendações alinhadas à WCAG; usado como referência de boas práticas.

## Implementações por critério (como foi aplicado)

Abaixo, o mapeamento dos principais critérios WCAG e a forma como foram tratados no projeto, com referências a arquivos/componentes.

### 1) Contraste e cores (WCAG 1.4.3, 1.4.11)
- O sistema oferece um modo de alto contraste e ajustes de cor para elementos interativos.
- Como: o botão “Aa” ativa classes na raiz elevando contraste e bordas visuais, incluindo foco visível e diferenciação de estados.

### 2) Tamanho do texto e reflow (WCAG 1.4.4, 1.4.10)
- Há um aumento de fonte global quando a acessibilidade está ativa.
- Como: escalas de fonte e espaçamento evitam quebra de layout em dispositivos pequenos; layout responsivo mantém legibilidade.

### 3) Navegação por teclado (WCAG 2.1.1, 2.1.2)
- Ações principais são acionáveis por teclado:
  - Botão “Aa” aceita Enter/Espaço além de clique.
  - Guia Operacional (tour) aceita Esc (fechar), Setas (próximo/voltar) e possui botões acessíveis.

### 4) Foco visível e ordem do foco (WCAG 2.4.3, 2.4.7)
- Indicadores de foco com `outline` reforçado em botões, links e toggles.
- O tour evita sobreposição de múltiplos overlays e mantém o destaque no elemento em foco.

### 5) Semântica, rótulos e relação entre campos (WCAG 1.3.1, 3.3.2)
- Campos de formulário utilizam `label` associado e estrutura semântica (form-floating preserva associação visual e semântica).
- Como: cada `input` tem `id` e `label for` correspondente, provendo rótulos claros.

### 6) Nome, Papel, Valor (WCAG 4.1.2, ARIA)
- Uso de atributos ARIA para expor estado e papel aos leitores de tela:
  - `aria-pressed` no botão de acessibilidade (estado persistido via `localStorage`).
  - Toasts com `aria-live="polite"` e `aria-atomic="true"` para feedback não intrusivo.
  - Diálogo de confirmação com `role="dialog"`, `aria-modal="true"` e `aria-labelledby`.

### 7) Conteúdo alternativo em Libras (Boas práticas; base legal: Lei 10.436/2002/Dec. 5.626/2005)
- Integração do VLibras para apoiar usuários que se comunicam em Libras.
- Como: o widget pode ser ativado pelo usuário; compatível com a maioria dos navegadores.

### 8) Feedback e mensagens (WCAG 3.3.1)
- As mensagens de sistema utilizam toasts não obstrutivos, com região `aria-live` para anunciar mudanças.
ossível evoluir com “focus trap” para segurar o foco dentro do diálogo enquanto aberto.

### 9) Guia Operacional acessível (tour)
- Destaque visual do elemento atual, tooltip com títulos, textos e botões navegáveis por teclado.
- Onde: `static/style.css` (classes `.tour-hole`, `.tour-tooltip`), `static/script.js` (lógica do tour), `templates/base.html` (botão `#help-toggle`).
- Como: o tour respeita a viewport, centraliza a rolagem e mantém uma única instância ativa para não confundir o usuário.

## Resumo
O sistema adota um conjunto consistente de boas práticas e requisitos normativos brasileiros e internacionais. Com o modo de alto contraste/fonte ampliada, integração com VLibras, navegação por teclado e um tour acessível, a aplicação oferece caminhos de uso mais inclusivos. 