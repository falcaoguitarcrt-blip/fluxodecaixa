# Relatório de auditoria de acessibilidade e responsividade

**Projeto:** Fluxo Pessoal  
**Data:** 27 de agosto de 2026  
**Escopo:** Visão Geral, Casal, Contas, Investimentos e Cartão de crédito.  
**Status:** auditoria concluída; **nenhuma correção funcional ou visual foi aplicada nesta etapa**.

## 1. Resumo executivo

A aplicação possui uma boa base estrutural: usa elementos nativos `<select>` para os filtros de período, perfil e módulo; os principais comandos são `<button>`; há uma regra global de foco visível; os tokens de tema já possuem testes de contraste; e os breakpoints reorganizam parte importante do conteúdo para telas menores. A suíte atual também mantém 12 verificações automatizadas relacionadas aos tokens de tema.

A auditoria, contudo, encontrou três grupos prioritários de risco. O primeiro é a dimensão de diversos alvos interativos, que fica abaixo do padrão interno solicitado de **44×44 CSS px**. O segundo é a acessibilidade de ações dependentes de botão direito e de linhas interativas, que não oferece um caminho equivalente por teclado. O terceiro é a semântica e a adaptação das tabelas, especialmente em Investimentos e Cartão de crédito.

O resultado não deve ser interpretado como uma certificação WCAG. O WCAG recomenda avaliação combinando testes automatizados e avaliação humana, e seus critérios são declarações testáveis, não apenas verificações de CSS [1]. Nesta rodada foram feitas inspeção estática do código, análise dos estilos e capturas em 1280×720, 767×900 e 375×812. A prévia sandbox não possui sessão autenticada para exercitar listas financeiras preenchidas, faturas reais ou contas atrasadas reais.

## 2. Critérios e método

Para contraste de texto normal, foi considerado o limiar AA de 4,5:1 do critério 1.4.3 [1]. Para foco, foi verificada a presença de foco visível nos controles e a possibilidade de alcançar as ações por teclado, em linha com o critério 2.4.7 [1]. Para áreas clicáveis, foi adotado o requisito explícito do pedido: **44×44 px ou maior**, que é mais rigoroso que o mínimo de 24×24 px definido pelo critério 2.5.8 do WCAG 2.2 [1].

A inspeção foi feita sobre `client/src/pages/Home.tsx`, `client/src/index.css` e `server/theme.test.ts`. Foram também executados os testes existentes: **69 testes passaram**, incluindo as verificações de tema, regras financeiras e estados de interface. Esse resultado confirma contratos e tokens, mas não substitui uma avaliação assistida por leitor de tela nem uma medição automatizada de cada elemento renderizado.

## 3. Achados globais de acessibilidade

| ID | Severidade | Área | Evidência encontrada | Impacto | Recomendação |
|---|---|---|---|---|---|
| A11Y-01 | Alta | Áreas clicáveis | `.period-btn` tem 30×39 px; `.header-tool` 40 px; `.action-btn` 40 px; `.header-icon` mobile 36×36 px; `.square-btn` chega a 29×29 px; `.modal-close` 32×32 px; `.profile-pills button` usa apenas padding compacto. | Dificulta o uso por pessoas com baixa precisão motora e viola o alvo de 44×44 px adotado para o produto. | Estabelecer uma classe de alvo mínimo para comandos primários, filtros, ícones e ações de linha; preservar espaçamento entre alvos adjacentes. |
| A11Y-02 | Alta | Teclado | Linhas de lançamentos recebem `tabIndex={0}`, mas não têm estilo próprio de `:focus-visible`, nem handlers de teclado equivalentes ao menu de botão direito. | A linha pode receber foco sem indicação visual e as opções editar, excluir e configurar categorias ficam dependentes do mouse. | Expor um botão de ações por linha ou abrir o mesmo menu com `Enter`, `Space` e uma tecla de atalho; adicionar foco visível às linhas. |
| A11Y-03 | Média | Navegação | Sidebar e navegação inferior usam botões sem `aria-current`; os perfis usam classe visual `active`, mas não `aria-pressed`; o contêiner dos perfis tem `aria-label`, sem explicitar um grupo de seleção. | Usuários de leitor de tela podem não identificar com segurança a aba ou o perfil ativo. | Adicionar `aria-current="page"` à aba ativa e `aria-pressed` aos botões de perfil e navegação quando o padrão de seleção for mantido. |
| A11Y-04 | Média | Controles iconográficos | O botão de menu mobile e o botão de notificações não têm `aria-label`. O menu mobile também não possui comportamento visível de abertura no trecho auditado. | Ícones isolados podem ser anunciados sem nome ou ficar sem função compreensível. | Nomear cada controle; se o menu ainda não for funcional, ocultá-lo como decoração ou implementar o drawer antes de expô-lo como comando. |
| A11Y-05 | Média | Ações pequenas | Links e ações como `.topbar-link`, `.edit-link`, `goal-add-button` e `.restore-btn` não definem altura mínima; algumas ações de linha usam fonte de 10–11 px. | Baixa área de toque e baixa legibilidade, principalmente em mobile. | Aplicar a mesma régua de 44 px aos comandos e manter texto mínimo confortável, sem depender apenas de ícones. |
| A11Y-06 | Média | Contraste aplicado | Os testes de tema verificam tokens semânticos, mas muitos componentes ainda possuem cores hardcoded, gradientes e cores de texto específicas por componente. O teste não calcula o contraste final de cada combinação de componente, estado hover, estado ativo, foco ou sobreposição. | Um token aprovado não garante contraste AA para todas as superfícies reais, especialmente labels pequenos, status e variantes de perfil. | Fazer medição renderizada por estado e substituir progressivamente cores hardcoded por tokens semânticos; incluir estados de foco, hover, disabled, alerta e Sara/Casal nos testes. |
| A11Y-07 | Média | Semântica de dados | Investimentos e a fatura de Cartão usam `div` com classes de grid (`table-row`, `statement-row`, `statement-head`) em vez de tabela semântica. | Leitores de tela não recebem relações de cabeçalho/célula, nome de coluna e navegação de tabela de forma confiável. | Migrar para `<table>`, `<thead>`, `<tbody>`, `<th scope="col">` e `<td>`, ou implementar roles completos apenas se a migração semântica não for viável. |
| A11Y-08 | Baixa | Movimento | A animação do sino de alerta recém-adicionada é acompanhada pela regra global `prefers-reduced-motion`, que reduz a duração das animações. | A base está correta, mas a garantia ainda não é coberta por teste visual de componente. | Manter o fallback reduzido e incluir uma verificação específica do estado urgente quando as correções forem aplicadas. |

## 4. Achados globais de responsividade

| ID | Severidade | Área | Evidência encontrada | Impacto | Recomendação |
|---|---|---|---|---|---|
| RESP-01 | Alta | Breakpoint principal | A sidebar só desaparece em `max-width: 720px`, embora o pedido considere telas menores que 768 px. Em 767 px, a sidebar de 225 px permanece fixa e o conteúdo principal fica comprimido. | Existe uma faixa de 721–767 px com experiência intermediária estreita, especialmente para filtros e cabeçalho. | Definir uma estratégia explícita até 767 px: antecipar o layout mobile ou criar um breakpoint tablet com sidebar recolhida. |
| RESP-02 | Alta | Investimentos | `.mobile-investments` é inicialmente `display: none` e não há regra correspondente que o reative no breakpoint mobile observado; o `.desktop-table` continua sendo a estrutura principal. | A tabela pode ficar apertada ou exigir rolagem horizontal implícita em telas estreitas, sem uma apresentação mobile realmente simplificada. | Ativar a lista mobile abaixo do breakpoint e ocultar a grade desktop; manter ações de editar acessíveis também na versão mobile. |
| RESP-03 | Média | Cartão de crédito | Cabeçalho e linhas de fatura continuam em grids com múltiplas colunas, incluindo colunas fixas de 70 px e 72 px, sem um contêiner de rolagem horizontal declarado. | Nomes longos de cartões e valores podem comprimir texto ou provocar overflow em 320–375 px. | Em mobile, transformar cada fatura em cartão empilhado ou encapsular a tabela em rolagem horizontal com indicação acessível. |
| RESP-04 | Média | Cards de KPI | A grade passa para duas colunas em mobile. Na captura de 375 px, os cards funcionam, mas os textos e valores quebram em várias linhas. | A leitura continua possível, porém os valores monetários podem perder hierarquia em perfis e estados com textos mais longos. | Testar strings longas, valores altos e rótulos de Sara/Casal; considerar uma coluna para cards críticos abaixo de 360 px. |
| RESP-05 | Média | Contas | O `bill-row` tem adaptação para grid até 720 px, mas mantém botões de 29 px e múltiplas informações na mesma linha. | Ações de editar/pagar ficam pequenas e podem disputar espaço com valor e status. | Aumentar os alvos e usar uma segunda linha de ações em telas estreitas. |
| RESP-06 | Baixa | Casal | Cards de detalhes passam para uma coluna até 900 px e o `content-grid` passa para uma coluna até 720 px. | O comportamento geral é adequado, mas deve ser revisado com dados longos e estados vazios preenchidos. | Manter a estratégia e testar com nomes, valores e percentuais extensos. |
| RESP-07 | Baixa | Navegação mobile | A navegação inferior fixa aparece em 720 px ou menos e utiliza fonte de 9 px; a captura de 375 px mostra boa presença, mas os rótulos são compactos. | Pode haver dificuldade de leitura para usuários com baixa visão, além de risco de sobreposição com conteúdo e botão flutuante. | Aumentar o texto e validar zoom de 200%, safe areas e distância entre o botão flutuante e a navegação. |

## 5. Auditoria por aba

### 5.1 Visão Geral

A estrutura possui cabeçalho contextual, seletor nativo de mês, seletor de perfil composto por botões, cards de KPI, gráfico, comprometimento, resumo do período, rotina, Sarinha IA e lançamentos. O seletor de mês é alcançável por teclado por ser um `<select>` nativo. Os botões de perfil também são focáveis nativamente.

Os principais riscos são a soma de vários comandos compactos no cabeçalho, a falta de `aria-pressed` ou equivalente nos perfis, os alvos menores que 44 px e o componente de lançamentos com linha focável sem foco visual específico. O gráfico usa elementos visuais e textos auxiliares, mas não oferece no trecho auditado uma alternativa tabular ou descrição equivalente para a série diária.

**Classificação da aba:** atenção necessária, principalmente em alvo de toque, estado de foco das linhas e alternativa acessível para o gráfico.

### 5.2 Casal

A aba possui uma hero section, quatro cards de resumo, três cards de detalhe e painéis individuais de Felipe e Sara. Os detalhes empilham abaixo de 900 px, e o conteúdo principal empilha abaixo de 720 px, o que é uma boa base responsiva.

Os riscos herdados são os mesmos do cabeçalho e dos cards compartilhados. A diferenciação cromática do Casal não deve ser a única forma de identificar o perfil; recomenda-se garantir que o nome do perfil, estado ativo e estrutura de títulos sejam anunciados. Os indicadores de participação usam barras visuais, portanto devem conservar texto percentual ou uma descrição acessível.

**Classificação da aba:** atenção moderada; estrutura responsiva favorável, com lacunas de anúncio de estado e contraste por estado.

### 5.3 Contas

A aba apresenta filtro de mês, filtro de status, cards de Vencimentos, Pendentes, Pagas e Atrasadas, além da lista de contas com edição e ação de pagamento. A ordenação visual do card Atrasadas foi implementada de forma condicional e não altera os dados.

O principal risco é a dimensão dos botões de linha e a densidade do `bill-row` em mobile. Como a lista não é uma tabela, a ausência de cabeçalhos de tabela não constitui falha por si só, mas a relação entre descrição, vencimento, responsável, valor e status deve continuar clara para leitor de tela. O filtro nativo de status é teclado-operável.

**Classificação da aba:** atenção moderada; prioridade para targets, foco e layout das ações em 375 px.

### 5.4 Investimentos

A aba contém seção de Caixinhas para Sara, filtros de mês/instituição/categoria, quatro cards de patrimônio, saldo por instituição e tabela detalhada. A estrutura desktop é clara, mas o fallback `.mobile-investments` permanece oculto no CSS auditado, enquanto a tabela de desktop não é explicitamente substituída no breakpoint mobile.

Esse é o maior risco responsivo entre as abas. Há também ausência de semântica de tabela, botões de edição abaixo de 44 px e possibilidade de o alerta de valor de mercado desatualizado ser percebido apenas visualmente se não houver texto associado ao card.

**Classificação da aba:** prioridade alta para correção responsiva e semântica.

### 5.5 Cartão de crédito

A aba possui filtros de mês, cartão e categoria, alternâncias de parcela/valor total e de todas/somente parceladas, exportação, tabela de faturas, total consolidado e cards individuais. As linhas de fatura são `<button>`, o que é positivo para foco e teclado, mas o cabeçalho continua sendo um conjunto de `<div>` e `<span>` sem semântica de tabela.

Em telas estreitas, o grid de fatura tem colunas fixas e não declara rolagem horizontal. Nomes de cartões, datas e valores podem perder espaço. Os controles segmentados são nativos como botões, mas seus estados dependem de classe `active` e não expõem `aria-pressed`.

**Classificação da aba:** atenção alta para semântica de dados, estados anunciados e apresentação mobile das faturas.

## 6. Auditoria específica dos seletores de período e perfil

| Controle | Teclado nativo | Foco visual | Estado anunciado | Resultado |
|---|---|---|---|---|
| Seletor de mês do cabeçalho | Sim, `<select>` | Sim, pela regra global para `select:focus-visible` | Rótulo via `aria-label="Selecionar mês"` | Adequado, sujeito à revisão de contraste e tamanho do controle |
| Seletor de perfil no cabeçalho | Sim, `<button>` | Sim, pela regra global para `button:focus-visible` | Não há `aria-pressed` nem `aria-current` | Parcial; estado visual existe, estado semântico deve ser acrescentado |
| Navegação lateral | Sim, `<button>` | Sim, pela regra global | Não há `aria-current` no item ativo | Parcial |
| Navegação inferior | Sim, `<button>` | Sim, pela regra global | Não há `aria-current` no item ativo | Parcial |
| Controle de mês anterior/próximo legado | Botões seriam focáveis | Foco global | Sem análise funcional completa; o componente `PeriodControl` não aparece como usado no fluxo principal auditado | Remover, conectar ou cobrir antes de reutilizar |

## 7. Plano de correção recomendado

| Ordem | Entrega recomendada | Justificativa |
|---|---|---|
| 1 | Padronizar alvos mínimos de 44 px para filtros, perfil, tema, fechar, editar, pagar, restaurar, segmentados e navegação mobile. | Remove a maior quantidade de barreiras de toque com uma alteração transversal. |
| 2 | Corrigir foco visível das linhas e substituir a dependência exclusiva do botão direito por ações equivalentes por teclado. | Garante que editar, excluir e categorias sejam operáveis sem mouse. |
| 3 | Corrigir semântica das tabelas de Investimentos e Cartão de crédito. | Melhora a leitura por leitor de tela e a navegação por colunas. |
| 4 | Ajustar breakpoint para cobrir todo o intervalo abaixo de 768 px e ativar a lista mobile de Investimentos. | Resolve a principal inconsistência entre tablet estreito e mobile. |
| 5 | Adicionar estados ARIA para perfil, navegação e alternâncias, além de nomes nos controles iconográficos. | Torna estados visuais comunicáveis por tecnologia assistiva. |
| 6 | Expandir testes de contraste por componente/estado e validação visual com dados preenchidos. | Fecha a lacuna entre tokens aprovados e combinações reais renderizadas. |

## 8. Limitações e próximos testes

A auditoria não aplicou alterações no código. Também não foi possível validar com dados persistidos reais na prévia sandbox, pois não havia sessão autenticada disponível. Portanto, o estado preenchido de Contas, Investimentos e Cartão de crédito deve ser revisado manualmente após login, incluindo nomes longos, valores monetários elevados, múltiplas categorias, várias faturas e contas atrasadas.

A próxima etapa recomendada é aplicar as correções na ordem acima e repetir a auditoria em 320×812, 375×812, 414×896, 767×900 e 1280×720, usando navegação somente por teclado e um leitor de tela. Também é recomendável executar uma ferramenta automatizada de acessibilidade em runtime e complementar seus resultados com avaliação humana.

## Referências

[1]: <https://www.w3.org/TR/WCAG22/> "Web Content Accessibility Guidelines (WCAG) 2.2 — W3C Recommendation"
