# Validação da consolidação Casal na Visão Geral

- O seletor de perfil do cabeçalho foi alterado para **Casal** na aba Visão Geral.
- O cabeçalho passou a exibir “fluxo Felipe + Sara / agosto de 2026”.
- A Visão Geral consumiu o resumo `couple.summary`; na prévia sem sessão autenticada, os quatro KPIs aparecem como R$ 0,00, R$ 0,00, R$ 0,00 e 0,0%, coerentes com a ausência de dados persistidos.
- O código da aba Casal também usa `trpc.finance.couple` para o mesmo mês e os mesmos campos `balance`, `income`, `expenses` e `commitment`.
- O teste `uses the same consolidated Casal summary in Overview and Couple views` cobre a equivalência do objeto consolidado.
- A seleção foi realizada no preview em 27/08/2026; a captura gerada pelo navegador está em `/home/ubuntu/screenshots/3000-idh064qey2p76gu_2026-08-27_21-37-32_2067.webp`.
- Limitação: sem sessão autenticada e sem dados reais, não é possível demonstrar valores financeiros diferentes de zero no print; a equivalência de fonte foi confirmada por código e teste automatizado.

## Comparação visual adicional

A aba dedicada Casal foi aberta para agosto de 2026 e exibiu os mesmos quatro valores da Visão Geral no estado sem autenticação: Saldo consolidado R$ 0,00, Entradas R$ 0,00, Saídas R$ 0,00 e Comprometido 0,0%. Os títulos são contextuais, mas os campos numéricos são alimentados por `data.summary` da mesma consulta `finance.couple`.

## Captura final

A Visão Geral foi reaberta com o perfil Casal ainda selecionado. A captura limpa final está em `/home/ubuntu/screenshots/3000-idh064qey2p76gu_2026-08-27_21-38-59_8515.webp`. O cabeçalho mostra “fluxo Felipe + Sara / agosto de 2026” e os quatro KPIs permanecem iguais aos da aba dedicada Casal no mesmo estado: R$ 0,00, R$ 0,00, R$ 0,00 e 0,0%.
