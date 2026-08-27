# Validação da Prioridade A

As capturas desktop e mobile confirmaram que a competência atual aparece no cabeçalho, na Sidebar, no resumo do período, nos lançamentos, no cartão de rotina e na Palavra do período. O estado sem dados não apresenta mais valores de demonstração no resumo, comprometimento ou assistente; os valores persistidos existentes continuam sendo exibidos.

A validação também confirmou que o layout permanece responsivo, com controles mensais legíveis no mobile. A sessão de prévia continua apresentando dados persistidos da conta conectada e os logs ainda registram eventos antigos de ausência de cookie; isso não impede a validação estática, mas a troca manual de competência com dados reais permanece uma conferência recomendada.

O filtro visual de Investimentos foi ajustado para receber `effectiveMonth`, mantendo o rótulo e a consulta no mesmo período quando a Home muda de competência.

## Resultado

- `pnpm check`: aprovado.
- `pnpm test`: 38 testes aprovados.
- `pnpm build`: aprovado.
- Capturas: desktop 1280×720 e mobile 390×844 aprovadas.
