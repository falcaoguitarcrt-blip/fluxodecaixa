# Validação — resultado acumulado de investimentos

O card **Resultado acumulado** agora identifica o caso em que um ativo possui aporte positivo e valor de mercado igual a zero. A regra usa os mesmos registros patrimoniais filtrados por instituição e categoria que alimentam o card, portanto não gera aviso para ativos fora do contexto selecionado.

Quando o caso é detectado, o cálculo original permanece visível e recebe o aviso: “Atualize o valor de mercado dos seus ativos para um cálculo de rentabilidade real.” O aviso inclui ícone informativo e usa tokens semânticos de tema.

A regra pura `hasUnpricedInvestments` foi coberta com casos de aporte positivo/mercado zero, ativo atualizado, ativo sem aporte e múltiplos ativos. `pnpm check`, `pnpm test` com 66 testes e `pnpm build` passaram. A Home foi revisada em desktop (1280×720) e mobile (375×812); não houve alteração de dados persistidos.
