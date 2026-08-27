# Auditoria técnica — Contas e lançamentos mensais

**Projeto:** Fluxo Pessoal  
**Escopo:** tela Contas, lançamentos, recorrências, mês global, perfis, status, persistência e impactos nos cálculos.  
**Data da auditoria:** 27 de agosto de 2026  
**Método:** inspeção do schema, helpers de banco, contratos tRPC, componentes React e suíte automatizada, sem alterar dados persistidos.

## Síntese executiva

A base atual está funcional para cadastro, edição, pagamento e filtragem básica, e a suíte existente passou com **34 testes**, além de `pnpm check`. Entretanto, a tela Contas ainda não é mensalmente confiável: os lançamentos da lista são filtrados pelo mês, mas os cartões de resumo, os alertas de rotina e a barra lateral usam conjuntos mais amplos ou um mês fixo. Isso pode fazer uma conta de outro período aparecer como compromisso do mês atual, ou fazer os números do cabeçalho não coincidirem com a lista.

A recomendação é não começar por alterações visuais. O primeiro ajuste deve ser uma **política única de calendário financeiro**, aplicada ao backend e ao frontend, definindo qual data governa cada entidade: `date` para lançamentos, `dueDate` para contas, `investedAt` para aportes e `purchaseDate` ou competência de fatura para cartões. Depois disso, todos os cartões, filtros, alertas, gráficos e exportações devem consumir o mesmo conjunto mensal.

## O que funciona hoje

| Área | Situação verificada | Observação |
|---|---|---|
| Consulta de contas | Funciona por usuário e perfil na consulta inicial | `listFinanceData` cria `billWhere` com `userId` e, quando informado, `profileId`. |
| Lista de contas | Filtra a lista por status calculado e mês de vencimento | A lista usa `effectiveMonth` e `resolveBillStatus`. |
| Status visual | Recalcula `paid`, `pending` e `late` usando a data atual | Uma conta não paga com vencimento passado aparece como atrasada mesmo que o banco ainda guarde `pending`. |
| Marcar paga/reabrir | Funciona como mutação protegida por usuário | A tela invalida o `bootstrap`, mas não invalida a consulta de rotina nem registra auditoria dessa alteração. |
| Criação de conta | Valida perfil, descrição, vencimento, responsável e valor | A criação registra auditoria. |
| Edição de conta | Existe formulário e procedimento tRPC | A atualização restringe por usuário, mas não confirma explicitamente o `profileId` ativo. |
| Lançamentos | Filtram por mês, banco e categoria | A data é comparada por `toISOString().slice(0, 7)`. |
| Investimentos | Possuem entidade, formulário e procedimento próprios | Não são convertidos em lançamento comum; o filtro usa `investedAt`. |
| Testes | A suíte atual passou | Resultado observado: 2 arquivos, 34 testes aprovados. Isso comprova contratos e helpers cobertos, não todos os fluxos de UI autenticados. |

## Problemas confirmados na tela Contas

### P0 — os cartões de resumo não respeitam o mês selecionado

A lista `visibleBills` filtra por `effectiveMonth`, mas os números de `pending`, `paid` e `late` são calculados sobre `bills`, que contém todos os meses retornados pelo `bootstrap`. O cartão de “Vencimentos” também usa `bills.length || 1`, portanto exibe **1** mesmo quando não existe nenhuma conta. O resultado é uma divergência direta: a lista pode estar vazia enquanto os cartões afirmam que há contas, pendentes ou pagas.

**Correção recomendada:** primeiro criar `monthBills = bills.filter(...)`; depois calcular todos os cartões exclusivamente sobre `monthBills`. Quando o conjunto estiver vazio, exibir zero, nunca um valor artificial. O filtro de status deve ser aplicado depois do filtro mensal.

### P0 — o seletor de mês de Contas é incompleto e o cabeçalho é fixo

A tela apresenta apenas “agosto de 2026” e “julho de 2026”, enquanto o mês global pode ser outro. O subtítulo permanece “contas do mês · agosto de 2026” mesmo depois da troca do período. Assim, um registro de setembro pode ser consultado pelo mês global, mas não aparece como opção local, e a comunicação da tela fica incorreta.

**Correção recomendada:** derivar as opções dos meses existentes, incluir sempre o mês global e formatar o título a partir de `effectiveMonth`. Se não houver registros, oferecer o mês global atual e os meses adjacentes somente como navegação explícita, sem fingir que existem contas.

### P0 — alertas e rotina podem misturar contas de outros meses

`listRoutineData` carrega todas as contas do perfil e chama `buildBillAlertSummary` sem receber o mês selecionado. Consequentemente, “próximos compromissos” e “vencimento passou?” podem incluir uma conta de outro mês. Além disso, a consulta da barra lateral usa o mês fixo `2026-08`, ignorando o mês global escolhido pelo usuário.

**Correção recomendada:** tornar o resumo de alertas mensal, recebendo `month` e filtrando por `dueDate` antes de separar atrasadas e próximas. A barra lateral deve receber o mesmo `activeMonth` usado pela Home. Deve ser definida uma regra explícita para contas atrasadas: mostrar atrasos históricos em um bloco separado ou limitar o alerta ao mês selecionado; não misturar os dois conceitos silenciosamente.

### P0 — recorrências não geram lançamentos mensais

O backend lista regras recorrentes, mas não materializa uma ocorrência mensal em `transactions` ou `bills`. A tela mostra apenas a quantidade de regras ativas quando não existem orçamentos. Portanto, criar uma recorrência não faz surgir automaticamente um lançamento pertinente no mês seguinte. Isso explica parte da percepção de que os lançamentos mensais “não fazem”.

**Correção recomendada:** escolher uma das duas políticas e documentá-la na interface. A opção mais segura é gerar ocorrências idempotentes por mês, com uma chave lógica formada por regra, mês e perfil, evitando duplicidade. A alternativa é manter recorrência apenas como lembrete e exigir confirmação manual para gerar o lançamento; nesse caso, o botão deve dizer claramente “gerar ocorrência”.

## Riscos de data e mês

| Risco | Onde ocorre | Impacto |
|---|---|---|
| Conversão de calendário para UTC | Filtros usam `new Date(...).toISOString().slice(0, 7)` e a interface usa `toLocaleDateString` | Registros salvos à meia-noite UTC podem aparecer no dia ou mês anterior no fuso brasileiro. Os formulários mitigam parcialmente usando `T12:00:00`, mas dados antigos/importados continuam vulneráveis. |
| Mês estruturalmente válido, mas inexistente | O regex aceita `2026-13` e `2026-00` | O contrato pode aceitar mês impossível; construções como `${month}-01` podem normalizar silenciosamente para outro período. |
| Datas de vencimento são `timestamp` | `bills.dueDate` guarda data e hora, embora o domínio seja um dia de calendário | Hora e fuso podem alterar o dia exibido e o mês usado no filtro. |
| Mês de cartão não é necessariamente mês de compra | Compras são filtradas por `purchaseDate` | Parcelas futuras não aparecem nas faturas dos meses seguintes, apesar de a compra continuar comprometendo o cartão. Isso precisa de competência de fatura separada. |

**Correção recomendada:** criar helpers únicos como `parseMonth`, `formatCalendarDate` e `monthKeyFromDate`, validar ano/mês semanticamente e definir uma convenção de armazenamento para datas de calendário. Para contas, o ideal é tratar vencimento como data civil sem deslocamento de fuso, ou normalizar sempre para meio-dia UTC e nunca misturar parsing de meia-noite local.

## Riscos de status, pagamento e auditoria

### Status manualmente inconsistente

Os contratos de criação e edição aceitam `status: "late"`. Atrasada é uma condição derivada de `dueDate` e do relógio atual, não deveria ser um valor livre no formulário. Uma conta marcada como paga permanece paga mesmo com vencimento passado, o que é correto; já uma conta criada como atrasada para uma data futura fica semanticamente incoerente.

**Correção recomendada:** aceitar apenas `pending` e `paid` na entrada, calcular `late` no backend e manter o status persistido mínimo. Se o banco precisar armazenar `late`, deve existir um processo determinístico de sincronização, não uma escolha manual do usuário.

### Pagamento não atualiza todas as consultas relacionadas

Depois de `markBillPaid`, a Home invalida `finance.bootstrap`, mas o cartão de rotina usa `finance.routine`. Isso pode deixar “próximos compromissos”, “atrasadas” e alertas laterais desatualizados até uma nova consulta. A visão Casal também merece invalidação quando uma conta muda, caso seu resumo inclua compromissos.

**Correção recomendada:** centralizar uma rotina de invalidação que atualize `bootstrap`, `routine`, `couple` e auditoria conforme a mutação. O mesmo deve valer para edição e exclusão.

### Pagamento não aparece no histórico de auditoria

`createBill` e `updateBill` registram auditoria, mas `markBillPaid` apenas atualiza a linha e retorna `true`. A operação mais sensível da tela Contas não deixa registro de quem pagou, reabriu ou em qual perfil isso ocorreu.

**Correção recomendada:** registrar ações `mark_paid` e `reopen` com `userId`, `profileId`, `entityId`, descrição e estado anterior/novo. O mesmo padrão deve ser aplicado a exclusões e restaurações de contas quando esses fluxos forem ampliados.

### Atualizações não confirmam o perfil ativo

`updateTransaction`, `updateBill`, `markBillPaid` e `deleteTransaction` restringem pelo `userId`, mas não pelo `profileId` recebido pela interface. Como os IDs são globais, um usuário autenticado poderia enviar o ID de um registro do próprio usuário pertencente ao outro perfil e alterá-lo a partir do perfil errado. Não é vazamento entre usuários, mas viola o isolamento operacional entre Felipe e Sara.

**Correção recomendada:** incluir `profileId` no contrato de edição, pagamento e exclusão, ou buscar a linha primeiro e verificar o perfil contra o contexto ativo antes da mutação. O backend deve ser a autoridade; esconder o item na UI não é suficiente.

## Lançamentos comuns: riscos específicos

O cadastro de lançamento valida descrição, data, valor, direção, categoria e banco, e o filtro mensal é aplicado à listagem. Ainda assim, há quatro riscos importantes. Primeiro, o mesmo problema de calendário UTC pode mover registros de dia ou mês. Segundo, a atualização não recebe perfil ativo para confirmar o escopo. Terceiro, a importação CSV pode criar registros com datas que caem em mês diferente do percebido pelo usuário se a convenção de data não for uniforme. Quarto, a exclusão envia o item à lixeira, mas a auditoria e os cálculos derivados precisam ser invalidados junto com a lista.

A interface agora oferece edição e menu contextual, mas a validação automatizada existente cobre principalmente contratos e helpers, não uma sequência completa de abrir menu, editar, confirmar exclusão, verificar lixeira e conferir os quatro cartões após trocar o mês. Essa sequência deve ser um teste de aceitação autenticado quando houver uma sessão disponível.

## Separação correta dos fluxos

| Fluxo | Deve representar | Deve aparecer na lista de lançamentos comuns? | Regra mensal sugerida |
|---|---|---:|---|
| Lançamento comum | Entrada ou saída efetivamente realizada | Sim, somente nesta entidade | Mês de `date`. |
| Conta | Compromisso/vencimento a pagar | Não automaticamente | Mês de `dueDate`; pagamento altera status, não cria uma saída duplicada. |
| Investimento | Aporte e patrimônio de investimento | Não automaticamente | Aporte no mês de `investedAt`; patrimônio de mercado pode ser acompanhado independentemente do mês do aporte. |
| Cartão | Compra e obrigação futura | Não automaticamente | Compra no mês da compra e parcelas na competência de fatura; não duplicar como saída comum. |
| Recorrência | Regra de repetição | Não até gerar ocorrência | Regra ativa + mês de ocorrência; geração idempotente por regra/perfil/mês. |

O risco mais grave de modelagem é permitir que uma conta paga ou uma compra de cartão seja também lançada manualmente como saída comum, duplicando o total da Home. A interface deve explicar quando um registro afeta o fluxo de caixa, o comprometimento ou apenas o patrimônio/obrigação futura.

## Ajustes priorizados para aprovação

### Prioridade A — correção de mês e consistência financeira

1. Criar uma política de calendário única e helpers de data/mês.
2. Corrigir Contas para calcular resumo, lista e estado vazio somente com o mês selecionado.
3. Remover mês fixo e opções hardcoded da tela, Sidebar e filtros.
4. Tornar alertas e rotina dependentes do mês global.
5. Validar semanticamente `YYYY-MM`.
6. Criar testes de limites: mês sem contas, conta em mês anterior/posterior, conta paga atrasada, vencimento no último dia e datas no fuso brasileiro.

### Prioridade B — segurança operacional e auditoria

1. Exigir `profileId` nas mutações de editar, pagar, reabrir e excluir.
2. Registrar pagamento e reabertura na auditoria.
3. Invalidar bootstrap, rotina, casal e auditoria após mutações.
4. Derivar atraso no backend, sem aceitar `late` livremente no formulário.
5. Testar que Felipe não consegue alterar conta de Sara do mesmo usuário por ID enviado manualmente.

### Prioridade C — recorrências e mensalização

1. Decidir se recorrência gera ocorrência automaticamente ou mediante confirmação.
2. Implementar idempotência por regra, perfil e mês.
3. Exibir a origem da ocorrência e permitir editar somente a ocorrência sem modificar a regra, ou oferecer claramente “editar regra”.
4. Testar troca de mês, regeneração, exclusão e alteração de uma regra já existente.

### Prioridade D — prevenção de duplicidade entre fluxos

1. Mostrar no formulário e nas listas que conta, cartão e investimento são entidades separadas de lançamento comum.
2. Adicionar indicadores de origem e impacto nos totais.
3. Definir competência de cartão para que parcelas futuras sejam exibidas no mês correto.
4. Evitar que pagamento de conta gere automaticamente uma saída duplicada sem confirmação explícita.

## Ordem recomendada de implementação

A ordem mais segura é **A → B → C → D**. Não recomendo implementar recorrências mensais antes de corrigir o calendário da tela Contas, pois a geração automática ampliaria qualquer erro de data e poderia criar duplicidades difíceis de rastrear.

## Resultado da validação atual

A auditoria não alterou dados. A checagem de tipos passou e a suíte atual passou com **34 testes em 2 arquivos**. Os testes existentes são uma boa base, mas ainda faltam testes de integração autenticada para a troca de mês na tela, pagamento com atualização de alertas, isolamento por perfil e duplicidade entre conta/cartão/investimento e lançamento comum.

> **Recomendação objetiva:** começar pela Prioridade A, especificamente pela correção mensal da tela Contas e pela política de calendário. Depois de aprovar essa etapa, a implementação poderá ser feita em pequenos marcos, cada um com testes antes do próximo checkpoint.
