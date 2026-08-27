# Validação — estados vazios

A Home foi validada em desktop (1280×720) e mobile (375×812), preservando o modo claro já ativo no ambiente de prévia.

## Cobertura

- **Lançamentos:** usa `EmptyState` com ícone de carteira/movimentação, mensagem contextual e ação `adicionar lançamento`.
- **Contas:** usa `EmptyState` com ícone de recibo, apoio sobre vencimentos e ação `adicionar conta`.
- **Investimentos:** usa `EmptyState` com ícone de tendência, apoio sobre patrimônio acumulado e ação `novo investimento`.
- **Cartão de crédito:** usa `EmptyState` com ícone de cartão, apoio sobre faturas/parcelas e ação `novo cartão`.
- **Fatura sem cartão:** não exibe valor, mês ou vencimento de cartão fantasma; mostra `Sem fatura para exibir` e `Cadastre um cartão para ver o resumo da fatura aqui.`

## Automação

O teste `server/empty-state.test.ts` confirma a existência de um único componente reutilizável, os quatro ícones e rótulos, os callbacks internos e a condição que remove o resumo monetário sem cartão. `pnpm check`, `pnpm test` e `pnpm build` foram executados com sucesso; a suíte ficou com 63 testes aprovados.
