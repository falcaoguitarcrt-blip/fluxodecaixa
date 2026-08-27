# Validação — alerta visual de contas atrasadas

A aba **Contas** agora mantém os quatro indicadores na ordem original quando não há atrasos. Quando existe pelo menos uma conta com status derivado como `late` no mês selecionado, o card **Atrasadas** recebe a classe de urgência e é movido visualmente para a primeira posição da grade.

O estado urgente usa fundo e borda em tons de alerta, texto com contraste adequado e o ícone de sino preenchido com uma animação curta e discreta. Os valores continuam sendo derivados do mesmo conjunto mensal de contas; a alteração é exclusivamente visual e não modifica status, vencimentos ou dados persistidos. A animação é desativada pela regra global de `prefers-reduced-motion`.

Foram cobertos por testes o acionamento condicional (`late.length > 0`), a ordem visual (`order: -1`), a neutralidade quando o total é zero, os tokens de alerta para os temas claro e escuro e a existência da animação reduzida. A validação passou em `pnpm test` com 69 testes, `pnpm check` e `pnpm build`. Também foram realizadas capturas desktop em 1280×720 e mobile em 375×812; a navegação e a grade permanecem responsivas. A prévia sandbox sem sessão autenticada não permitiu inserir uma conta atrasada real para observar o estado preenchido diretamente no navegador; esse fluxo permanece como validação manual com dados do usuário.
