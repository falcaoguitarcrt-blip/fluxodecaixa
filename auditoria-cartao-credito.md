# Auditoria da tela Cartão de crédito

**Escopo.** Esta auditoria revisou o schema de cartões e compras, os contratos tRPC, os agregadores de fatura, a tela React, os filtros, o cálculo de vencimento, a alternância entre parcela e valor total, a exportação CSV, o isolamento por perfil e a visão Casal. Nenhum código funcional ou dado financeiro foi alterado durante a análise.

## Resultado executivo

A base atual está funcional para cadastrar cartões e compras, filtrar o mês da compra, exibir vencimento projetado no mês seguinte, alternar entre valor da parcela e valor total e consolidar cartões no Casal. A suíte atual permanece verde: `pnpm check` passou e **47 testes em 2 arquivos** passaram.

O principal problema confirmado é a divergência entre os dados filtrados na tela e os valores usados pelo detalhamento de fatura. O backend calcula `cardStatements` apenas por mês e cartão, enquanto a interface também permite filtrar por categoria e por “só parceladas”; por isso, o total da fatura pode continuar incluindo compras que a tabela visualmente esconde. Há ainda uma limitação estrutural importante: parcelas futuras não são materializadas por competência. Uma compra parcelada aparece apenas no mês da compra, e `currentInstallment` não participa da geração dos meses seguintes.

## Matriz de achados

| Prioridade | Achado | Situação | Impacto |
|---|---|---|---|
| P0 | `cardStatements` ignora o filtro de categoria | Confirmado no código | Total da fatura e linhas podem divergir da lista filtrada |
| P0 | “Só parceladas do mês” filtra a lista, mas não os totais do resumo | Confirmado no código | O usuário vê um subconjunto, mas o valor exibido soma todas as compras |
| P0 | Parcelas futuras não são projetadas para os meses seguintes | Confirmado no modelo/consulta | Faturas futuras ficam incompletas e o mês seguinte pode parecer sem compra |
| P1 | Fechamento não define a competência da fatura | Confirmado no agregador | Compra no dia do fechamento ou após ele pode cair na fatura errada |
| P1 | Não existe estado persistente de fatura paga, pendente ou atrasada | Confirmado no schema | “Em aberto” é apenas sinônimo de haver compras, não de status financeiro |
| P1 | Divisão decimal pode gerar soma diferente do total | Risco determinístico | R$ 100,00 em 3 parcelas gera R$ 33,33 x 3 = R$ 99,99 |
| P1 | Edição de compra valida apenas `userId`, não o perfil ativo/cartão associado | Confirmado no helper | Uma chamada manipulada pode editar registro de outro perfil do mesmo usuário |
| P1 | Não há chave de idempotência para compra | Confirmado no schema | Duplo clique, reenvio ou importação podem duplicar uma despesa |
| P2 | Vencimento é projetado, mas não considera pagamento real | Confirmado no modelo | O usuário não consegue fechar o ciclo da fatura |
| P2 | Fechamento e vencimento aceitam dias válidos isoladamente, sem regra de relação | Confirmado no contrato | Configurações como vencimento antes do fechamento ficam semanticamente ambíguas |
| P2 | Exportação CSV não informa competência calculada, filtro aplicado ou status da fatura | Observação de produto | Arquivo exportado pode ser interpretado fora do contexto |

## 1. Competência mensal e fechamento

A tela usa `purchaseDate` como competência principal. Isso é suficiente para compras à vista simples, mas não representa uma fatura de cartão. A competência real deveria ser derivada pelo dia de fechamento: uma compra realizada antes ou no limite definido pertence à fatura daquele ciclo; uma compra posterior pertence à fatura do ciclo seguinte. Hoje `buildCardStatementDetails` recebe o mês selecionado e sempre associa as compras já filtradas àquele mês, sem recalcular a competência a partir de `closingDay`.

A situação fica mais sensível no limite do fechamento. É necessário definir uma política explícita para compras feitas exatamente no dia de fechamento, inclusive horário e fuso. Sem essa decisão, duas telas ou dois dispositivos podem classificar a mesma compra de forma diferente.

| Cenário | Comportamento desejado para aprovação | Comportamento atual |
|---|---|---|
| Compra à vista antes do fechamento | Fatura do ciclo corrente | Mês de `purchaseDate` |
| Compra no dia do fechamento | Regra explícita, preferencialmente até o horário de corte | Mês de `purchaseDate` |
| Compra após o fechamento | Próxima fatura | Mês de `purchaseDate` |
| Compra parcelada | Uma ocorrência por fatura futura | Um único registro no mês da compra |

A correção recomendada é criar uma função pura de competência de fatura, usando calendário civil UTC e a configuração do cartão, e testá-la para virada de mês, fevereiro, dezembro e compra no dia do fechamento. Depois, o sistema deve materializar ou calcular as ocorrências de parcelas por fatura sem duplicar o registro original.

## 2. Divergências confirmadas nos filtros

A consulta de bootstrap calcula `cardMonth` com mês e cartão, mas não recebe categoria. A tela, por sua vez, calcula `visiblePurchases` com mês, cartão, categoria e o modo “só parceladas”. O objeto `statement` usado nas linhas de cada cartão continua vindo do conjunto mais amplo do backend. Assim, selecionar uma categoria pode esconder compras na tabela, mas manter o valor total do cartão incluindo outras categorias.

O mesmo problema ocorre no modo de parcelamento. `onlyInstallments` altera `visiblePurchases`, porém os totais gerais continuam usando `cardInstallments` e `cardTotal` calculados antes desse filtro. A interface pode informar “1 compra visível” e, simultaneamente, apresentar o total de todas as compras do cartão.

A correção deve escolher uma única fonte filtrada para a renderização. O ideal é o backend receber todos os filtros de fatura, devolver detalhes já derivados para a mesma seleção e a interface usar exclusivamente esses detalhes. Como proteção adicional, testes devem verificar que categoria e modo parcelado alteram simultaneamente lista, cartões, subtotal e total.

## 3. Parcelas e valores

O modelo guarda `totalAmount`, `installmentAmount`, `installments` e `currentInstallment`, mas não guarda as ocorrências mensais ou a competência da próxima parcela. O campo `currentInstallment` é validado para não exceder `installments`, porém não participa da consulta de fatura. Consequentemente, uma compra de 10 parcelas não aparece automaticamente nos nove meses posteriores.

Também há um risco de arredondamento: o contrato calcula `totalAmount / installments` em ponto flutuante e arredonda a parcela para duas casas. Quando a divisão não é exata, a multiplicação das parcelas não fecha com o valor total. A política recomendada é guardar centavos inteiros ou calcular uma parcela-base e um ajuste residual na última parcela. O usuário deve ver claramente se o valor exibido é a parcela regular ou a parcela ajustada.

A deduplicação também precisa ser específica de cartão. A assinatura atual usada para lançamentos comuns não resolve compras de fatura, pois duas compras legítimas podem ter a mesma data, descrição e valor. Recomenda-se uma chave de importação opcional, combinada com cartão, data, descrição, valor total e número da parcela, além de uma confirmação quando a duplicidade for apenas provável.

## 4. Status, pagamento e vencimento

O status atual da fatura é `open` quando há compras e `empty` quando não há. Isso não equivale a paga, pendente ou atrasada. O vencimento é apenas uma data calculada a partir do mês seguinte e do `dueDay`; não existe registro de pagamento, data de pagamento ou auditoria de liquidação de fatura.

A próxima evolução deveria criar uma entidade de fechamento de fatura por cartão e competência, com status derivado ou controlado por operação protegida: `open`, `paid`, `late` e, se necessário, `closed`. O status `late` deve depender da data civil atual e não substituir um pagamento registrado. O cartão precisa exibir claramente “sem compras”, “em aberto”, “paga” ou “atrasada”, sem usar “em aberto” apenas porque existe uma compra.

## 5. Isolamento por perfil

A criação de uma compra confere que o cartão pertence ao `userId` e ao `profileId` informados. A listagem também é construída a partir do perfil selecionado, o que separa corretamente Felipe e Sara no fluxo normal da interface. A visão Casal consolida somente os perfis Felipe e Sara do usuário autenticado.

Entretanto, `updateCardPurchase` localiza a compra apenas por `id` e `userId`; não exige o perfil ativo nem confere se o cartão associado continua pertencendo ao mesmo perfil. `updateCreditCard` possui a mesma característica para cartões. O risco não aparece em uma utilização comum, mas deve ser fechado no servidor, pois o frontend nunca deve ser a única barreira de isolamento.

| Área | Felipe | Sara | Casal |
|---|---|---|---|
| Cartões e compras | Perfil próprio, filtros e faturas mensais | Perfil próprio, mesma regra técnica; identidade visual roxa | Soma cartões e faturas dos dois perfis, sem misturar IDs |
| Categorias | Devem vir das compras reais do perfil | Devem vir das compras reais da Sara | Não deve criar uma categoria compartilhada artificial |
| Parcelas | Deve receber ocorrências da própria competência | Deve receber ocorrências da própria competência | Deve somar ocorrências equivalentes sem duplicar a compra |
| Pagamento | Status e auditoria próprios | Status e auditoria próprios | Visão consolidada, sem permitir pagamento por contexto ambíguo |
| Exportação | CSV do perfil/filtros selecionados | CSV da Sara/filtros selecionados | Exportação consolidada deve identificar o perfil de origem |

## 6. Prioridades recomendadas

### Prioridade A — corrigir inconsistências visíveis da fatura

Unificar os filtros de categoria e “só parceladas” entre tabela, cartões individuais, subtotal e total. O resultado deve ser testado com pelo menos duas categorias e uma compra parcelada. Esta é a correção de maior urgência porque já pode apresentar um valor diferente do conjunto que o usuário selecionou.

### Prioridade B — criar competência real de fatura e projeção de parcelas

Implementar a função de competência pelo fechamento, definir o tratamento do dia-limite e gerar ocorrências futuras de parcelas de forma idempotente. A fatura de cada mês deve mostrar apenas as ocorrências que pertencem àquele ciclo, enquanto o detalhe da compra deve continuar permitindo rastrear o total original.

### Prioridade C — fechar o ciclo de pagamento

Criar status e operação protegida para pagar/reabrir faturas, com auditoria, cálculo de atraso e invalidação de todas as consultas relacionadas. O Casal deve apenas consolidar o estado dos perfis, sem permitir que uma ação ambígua altere o cartão errado.

### Prioridade D — reforçar integridade e importação

Adicionar validação server-side de perfil em edição, política de arredondamento, idempotência de criação/importação, relação entre fechamento e vencimento e CSV com competência calculada, perfil e status.

## 7. Testes recomendados antes de implementar

| Grupo | Casos obrigatórios |
|---|---|
| Filtros | Categoria altera lista e totais; modo parcelado altera lista e totais; cartão selecionado permanece isolado |
| Competência | Antes, no dia e depois do fechamento; virada de mês; fevereiro; dezembro/janeiro |
| Parcelas | Compra de 1, 2 e 10 parcelas; mês inicial e meses posteriores; última parcela com ajuste residual |
| Perfil | Felipe não edita compra da Sara; Sara não edita cartão de Felipe; Casal soma sem duplicar |
| Status | Fatura vazia, aberta, paga, reaberta e atrasada; vencimento já passado |
| Duplicidade | Reenvio da mesma compra; importação repetida; duas compras legítimas iguais |
| Valores | Soma das parcelas igual ao total; valores com centavos e divisão não exata |
| Interface | Estados vazios honestos; troca de mês; exportação com filtros; desktop e mobile |

## Conclusão

A tela de Cartão de crédito já oferece uma base útil, mas ainda deve ser tratada como uma lista de compras mensais, não como um ciclo completo de faturas. A sequência mais segura é corrigir primeiro a divergência dos filtros, depois modelar competência e parcelas futuras, e somente então introduzir pagamento e status de fatura. Essa ordem reduz o risco de corrigir a aparência sem corrigir a origem do cálculo.
