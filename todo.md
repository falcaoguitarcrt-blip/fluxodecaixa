# Tarefas de integração do fluxo.html como base principal

- [x] Ler o arquivo `fluxo.html` enviado e identificar textos, tokens visuais e componentes adicionais.
- [x] Comparar os comportamentos descritos no HTML com a implementação atual em React.
- [x] Usar o `fluxo.html` como base principal de estrutura e comportamento, preservando as referências visuais das imagens. Prioridades: filtros de lançamentos por Todas/Entradas/Saídas, totais calculados, gráfico de tendência/donut, edição compartilhada e lixeira com restauração.
- [x] Adicionar recursos das imagens: navegação inferior mobile, alternância Felipe/Sara/Casal, modo claro/escuro, seletor de período, busca de lançamentos, cartões com parcela/valor total, estados vazios, notificações e Sarinha IA.
- [x] Executar novamente a checagem de tipos e o build após a integração.
- [x] Validar visualmente desktop e mobile antes da entrega.

## Prioridade 2 — cálculos e filtros dinâmicos

- [x] Definir regras de saldo, entradas, saídas, investimentos, faturas e comprometimento da receita. Faturas e cartões agora têm estrutura persistente para parcelas.
- [ ] Implementar filtros persistentes por período, banco, categoria, pessoa e cartão. Contrato de filtros criado no backend; controles visuais avançados ainda pendentes.
- [x] Criar agregações de dados no backend para alimentar cartões e gráficos, incluindo série diária de entradas e saídas.
- [ ] Conectar tabelas, cartões de resumo e gráficos aos dados calculados. Cartões de resumo, comprometimento, gráfico e lista principal já usam resultados persistidos; tabelas de contas, investimentos e cartões ainda pendentes.
- [ ] Validar valores, filtros, estados vazios e testes automatizados. Check, testes e build aprovados; validação visual autenticada e filtros avançados pendentes.

## Lacunas adicionais da Prioridade 2

- [x] Implementar agregações reais para faturas e cartões de crédito por período e cartão.
- [x] Substituir o gráfico estático por séries dinâmicas de entradas e saídas.
- [ ] Conectar as tabelas de contas, investimentos e cartões aos dados persistidos.
- [x] Adicionar testes para faturas, comprometimento e séries do gráfico.

## Ajustes finais da Prioridade 2

- [ ] Conectar a tela de Cartões aos dados persistidos e expor totais por cartão e período. O resumo dinâmico de parcela foi conectado; a tabela e os controles de segmentação ainda pendentes.
- [x] Adicionar filtro de cartão ao contrato financeiro.
- [x] Tornar o eixo X, escala Y, labels e estado vazio do gráfico totalmente dinâmicos.
- [x] Adicionar testes para agregações de cartões e geração da série diária.

## Ajustes de validação antes do checkpoint

- [x] Adicionar teste unitário cobrindo o cálculo de comprometimento da receita.
- [x] Remover barras de fallback estáticas e exibir estado vazio real quando não houver série.
- [x] Validar visualmente o gráfico sem dados.
