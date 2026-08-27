# Validação da Prioridade 2 — governança de contas

## Escopo

A Prioridade 2 reforçou o fluxo de contas sem alterar dados financeiros existentes. O pagamento e a reabertura agora exigem o usuário autenticado, o perfil ativo e a competência mensal selecionada. Uma conta pertencente a outro perfil ou a outro mês não pode ser alterada por essa operação.

A edição de contas também exige o perfil ativo. O status `late` deixou de ser um estado manual aceito no cadastro; atraso é derivado da combinação entre vencimento, status de pagamento e data de referência. Isso evita que uma conta futura seja gravada como atrasada ou que o resumo contradiga a lista.

## Auditoria e atualização da interface

Pagamentos geram evento `payment`; reaberturas geram `reopen`; alterações sem mudança de status continuam como `update`. Após qualquer mutação financeira, a interface invalida bootstrap, rotina, casal, histórico e objetivos relacionados, reduzindo o risco de cartões e alertas permanecerem desatualizados.

A prévia visual em desktop preservou a hierarquia editorial, os cards mensais e as ações de registro. A validação com sessão autenticada e dados de múltiplos perfis ainda deve ser realizada manualmente pelo usuário, pois a prévia sandbox não fornece uma sessão de login real.

## Evidências

| Verificação | Resultado |
|---|---|
| `pnpm check` | Aprovado |
| `pnpm test` | 41 testes aprovados |
| `pnpm build` | Aprovado |
| Dados financeiros persistidos | Não alterados |
| Validação visual | Desktop 1280×720 aprovado |

## Limitações conhecidas

A suíte valida contratos, helpers e barreiras de entrada, mas não substitui um teste de integração com banco autenticado para confirmar a mutação de uma conta real entre dois perfis. Essa conferência deve ser feita com uma conta de teste ou com dados que o usuário esteja disposto a manipular.
