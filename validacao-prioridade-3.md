# Validação da Prioridade 3 — recorrências mensais

## Implementação

As regras recorrentes agora geram automaticamente uma ocorrência de lançamento para o mês solicitado, antes da leitura do dashboard e da rotina. Cada ocorrência é vinculada ao usuário, perfil, regra, lançamento materializado e competência `YYYY-MM`.

A tabela `recurring_occurrences` possui uma chave única por regra e mês. Assim, chamadas repetidas, troca de tela ou carregamentos concorrentes não devem criar a mesma ocorrência duas vezes. A geração ocorre dentro de uma transação: o lançamento e o registro da ocorrência são confirmados juntos.

A data da ocorrência usa calendário civil UTC, limita o dia 31 ao último dia do mês e respeita os dias exatos de início e fim da regra. Regras inativas ou fora da competência selecionada não são materializadas nem exibidas na rotina daquele mês. A criação de regras também valida o perfil e registra auditoria.

## Migração e validação

| Verificação | Resultado |
|---|---|
| Migração `0006_needy_vampiro.sql` | Aplicada com sucesso |
| `pnpm check` | Aprovado |
| `pnpm test` | 44 testes aprovados |
| `pnpm build` | Aprovado |
| Responsividade | Desktop e mobile revisados |
| Dados financeiros existentes | Não alterados |

## Limitação

Os testes puros cobrem idempotência conceitual, datas-limite, competência inválida e regras inativas. A confirmação operacional de duas chamadas concorrentes contra o banco e a troca de mês com dados autenticados deve ser realizada manualmente pelo usuário, pois a prévia atual não fornece uma sessão de login real.
