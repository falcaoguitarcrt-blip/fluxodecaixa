# Auditoria comparativa — Contas, lançamentos e investimentos

**Projeto:** Fluxo Pessoal  
**Escopo:** Contas, lançamentos mensais, investimentos da Sara, isolamento por perfil e visão Casal.  
**Método:** inspeção do schema, helpers de banco, contratos tRPC, componentes React, regras de competência e suíte automatizada. Nenhum dado financeiro foi alterado.

## Síntese executiva

A base está funcional para cadastro, edição, filtragem mensal, pagamento de contas, materialização de recorrências e separação entre lançamentos, contas, cartões e investimentos. A suíte atual passou com **44 testes**, e a checagem de TypeScript também passou.

O principal ponto restante não é uma falha simples de cadastro, mas uma diferença de significado entre **movimentação mensal** e **patrimônio acumulado**. Contas e lançamentos devem ser estritamente mensais. Investimentos precisam separar aportes realizados na competência do patrimônio de mercado que continua existindo nos meses seguintes. Atualmente, a tela filtra investimentos por `investedAt`, fazendo com que um investimento antigo desapareça quando outro mês é escolhido, embora seu patrimônio ainda exista.

> **Conclusão:** não recomendo tratar Felipe e Sara com regras financeiras diferentes. Recomendo usar a mesma regra de competência para ambos, acrescentando recursos específicos para Sara somente nas caixinhas e na apresentação de seus objetivos.

## O que funciona atualmente

| Área | Situação | Observação |
|---|---|---|
| Contas | Funcional e mensal | A consulta usa perfil e competência; resumo e lista usam `dueDate`; status atrasado é derivado. |
| Pagamentos | Protegidos | Pagamento/reabertura exigem usuário, perfil e mês e geram auditoria. |
| Lançamentos comuns | Funcionais e mensais | O filtro usa `date`; recorrências podem materializar ocorrências idempotentes. |
| Recorrências | Materialização implementada | Uma regra gera no máximo uma ocorrência por mês pela chave única da tabela de ocorrências. |
| Investimentos | Entidade separada | Não são convertidos em lançamentos comuns; usam `investedAt` para o filtro atual. |
| Sara | Caixinhas persistentes | Objetivos são exclusivos do perfil Sara e têm valor atual, meta e progresso. |
| Casal | Consolidação protegida | Agrega somente perfis Felipe e Sara pertencentes ao usuário autenticado. |
| Testes | Linha de base aprovada | `pnpm check` e 44 testes Vitest passaram; isso não substitui teste autenticado de UI. |

## Contas e lançamentos: riscos e melhorias

### Prioridade A1 — impedir edição fora da competência visual

O pagamento e a reabertura já recebem `profileId` e `month`, e o backend confere a conta antes de alterar. A edição de conta já exige `profileId`, mas não recebe explicitamente a competência da tela. Assim, um usuário pode abrir uma conta do mês selecionado e alterar seu vencimento para outro mês. Isso pode ser permitido como uma ação consciente, mas precisa de confirmação explícita, pois a conta desaparecerá da lista após o salvamento.

**Recomendação:** ao alterar `dueDate` para outra competência, exibir confirmação informando o mês anterior e o novo mês. Alternativamente, bloquear a mudança no formulário comum e oferecer uma ação específica “mover para outro mês”.

### Prioridade A2 — status derivado precisa ser explicado ao usuário

O sistema calcula `late` a partir do vencimento e do status salvo. Essa regra é correta, mas a interface ainda permite editar `pending` ou `paid` sem explicar que “atrasada” não é uma escolha manual. Usuários podem interpretar a reabertura de uma conta vencida como “pendente”, enquanto a tela imediatamente a exibirá como “atrasada”.

**Recomendação:** incluir ajuda curta no formulário: “Atrasada é calculada automaticamente quando a conta pendente passa do vencimento”. Após reabrir uma conta vencida, informar que ela voltou a pendente no banco, mas continua visualmente atrasada pela data.

### Prioridade A3 — proteger todo o fluxo de lançamentos pelo perfil

Contas receberam a verificação explícita de perfil. Entretanto, a auditoria comparativa deve manter como pendência a revisão equivalente para `updateTransaction`, `deleteTransaction`, `updateInvestment`, `updateCreditCard` e exclusões relacionadas. A interface oculta registros fora do perfil, mas a autoridade definitiva precisa estar nos helpers do banco para cada mutação.

**Recomendação:** padronizar uma função de busca e autorização que confira `userId`, `profileId` e entidade antes de qualquer update/delete. O teste deve tentar usar um ID do perfil Sara enquanto o contexto selecionado é Felipe, e vice-versa.

### Prioridade A4 — duplicidade entre fluxos

A separação de entidades está correta, mas o modelo ainda permite que o usuário registre uma compra de cartão, uma conta ou um investimento e crie manualmente uma saída equivalente em lançamentos comuns. Isso pode duplicar os totais, dependendo do que foi efetivamente pago e do que o resumo considera.

**Recomendação:** incluir no formulário uma indicação de impacto: lançamento comum afeta entradas/saídas; conta afeta compromissos; cartão afeta fatura; investimento afeta patrimônio. Antes de salvar uma saída com descrição e valor semelhantes, oferecer apenas um aviso não bloqueante, sem tentar deduzir automaticamente que os registros são duplicados.

## Investimentos: achados específicos

### Prioridade B1 — separar aporte mensal de patrimônio acumulado

A tela de Investimentos consulta o backend com o mês selecionado e filtra por `investedAt`. Isso é adequado para responder “quanto foi aportado neste mês”, mas não para responder “qual é meu patrimônio atual”. O card chamado “Valor de mercado” hoje representa apenas os investimentos cujo aporte ocorreu na competência selecionada. Um aporte de Sara feito em janeiro pode desaparecer da visão em agosto, embora seu valor de mercado continue relevante.

**Recomendação:** dividir os indicadores em “Aportes no mês”, “Patrimônio de mercado” e “Resultado acumulado”. A tabela pode manter um filtro de competência para aportes, enquanto o patrimônio usa posições vigentes ou o último valor conhecido.

### Prioridade B2 — mesma regra para Felipe e Sara, com apresentação específica da Sara

Não há justificativa técnica para uma regra mensal diferente por pessoa. Felipe e Sara devem usar a mesma competência para aportes, a mesma política de cálculo e a mesma proteção de perfil. A diferença legítima é que Sara possui `savingsGoals`, que são objetivos persistentes e não devem zerar quando o mês muda.

**Recomendação:** rotular as caixinhas como “saldo atual” ou “progresso acumulado”, deixando explícito que elas não são lançamentos mensais. Para Sara, adicionar uma visão opcional de “aportes do mês” sem misturá-la com o saldo das caixinhas.

### Prioridade B3 — corrigir o título e a semântica visual do módulo

O cabeçalho de Investimentos usa texto fixo equivalente a “patrimônio do fluxo Felipe”, mesmo quando Sara está selecionada. Esse é um erro de comunicação, não de cálculo, e pode fazer a usuária interpretar que os dados dela não estão sendo considerados.

**Recomendação:** usar o nome do perfil ativo no subtítulo, ou usar um rótulo neutro como “patrimônio do perfil”. Na visão Casal, usar “patrimônio consolidado”.

### Prioridade B4 — remover opções de filtro que não vêm dos dados

O filtro de instituição usa opções fixas como Inter, Rico e PicPay. Isso pode esconder instituições reais que sejam cadastradas depois e mantém opções sem resultado. O filtro de categoria também usa categorias de fallback quando não há categorias retornadas.

**Recomendação:** derivar instituições e categorias dos registros do perfil, preservando opções históricas quando necessário. Em estado vazio, mostrar somente “Todos” e uma mensagem de cadastro, sem opções fictícias.

### Prioridade B5 — corrigir “última atualização”

O card “Última atualização” usa a primeira linha ordenada por `investedAt`, que representa a data do aporte, não necessariamente a data em que o valor de mercado foi atualizado. O schema possui `updatedAt`, mas essa semântica ainda não é apresentada.

**Recomendação:** renomear o card para “Último aporte” se a intenção for mostrar `investedAt`, ou usar `updatedAt` e documentar que se trata da última atualização do registro. Para patrimônio confiável, será necessário um histórico de posições/avaliações.

## Diferenças de prioridade por perfil

| Perfil/visão | Prioridade imediata | Risco principal | Melhoria específica |
|---|---|---|---|
| Felipe | A3 e B1 | Mutação por ID fora do perfil e patrimônio mensal confundido com acumulado | Aplicar a mesma autorização e separar aporte de patrimônio. |
| Sara | B1, B2 e B3 | Investimento antigo desaparece por mês; caixinhas podem ser confundidas com fluxo mensal; título fixo incorreto | Aportes mensais separados de caixinhas/saldo atual e cabeçalho contextual correto. |
| Casal | A3 e B1 | Soma patrimonial limitada ao mês do aporte pode subestimar o patrimônio consolidado | Exibir aportes do mês e patrimônio consolidado em cartões distintos, com origem por perfil. |
| Ambos | A1, A2 e A4 | Mudança de vencimento, status entendido de forma incorreta e duplicidade entre entidades | Confirmações, explicações de impacto e autorização uniforme. |

## Ordem recomendada antes de implementar

| Ordem | Entrega | Motivo |
|---:|---|---|
| 1 | Separar aportes mensais de patrimônio acumulado | Evita que Sara e Casal vejam patrimônio incorreto ao trocar o mês. |
| 2 | Aplicar autorização por perfil a todas as mutações de entidades | Fecha a principal lacuna operacional comum aos dois perfis. |
| 3 | Corrigir título, filtros derivados e “última atualização” de Investimentos | Remove inconsistências visuais e opções sem dados. |
| 4 | Confirmar movimentação de contas entre meses e explicar status atrasado | Reduz erros de interpretação nos lançamentos. |
| 5 | Adicionar prevenção de duplicidade entre conta, cartão, investimento e saída comum | Evita totais inflados sem bloquear o uso legítimo. |

## Validação realizada

A auditoria foi executada sem alteração de dados financeiros. `pnpm check` passou, e `pnpm test` passou com **44 testes em 2 arquivos**. A revisão visual mobile confirmou que o layout permanece utilizável após as mudanças anteriores. A prévia não possui sessão autenticada para executar uma sequência real de troca de perfil, criação, pagamento e troca de mês; essa etapa deve ser feita manualmente quando houver login.

> **Recomendação objetiva:** começar pela separação entre aporte mensal e patrimônio acumulado, pois essa decisão afeta Sara, Felipe e Casal simultaneamente. Depois, fechar a autorização por perfil em todas as mutações.
