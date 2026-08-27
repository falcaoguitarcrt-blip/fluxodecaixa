# Tarefas de integração do fluxo.html como base principal

- [x] Ler o arquivo `fluxo.html` enviado e identificar textos, tokens visuais e componentes adicionais.
- [x] Comparar os comportamentos descritos no HTML com a implementação atual em React.
- [x] Usar o `fluxo.html` como base principal de estrutura e comportamento, preservando as referências visuais das imagens. Prioridades: filtros de lançamentos por Todas/Entradas/Saídas, totais calculados, gráfico de tendência/donut, edição compartilhada e lixeira com restauração.
- [x] Adicionar recursos das imagens: navegação inferior mobile, alternância Felipe/Sara/Casal, modo claro/escuro, seletor de período, busca de lançamentos, cartões com parcela/valor total, estados vazios, notificações e Sarinha IA.
- [x] Executar novamente a checagem de tipos e o build após a integração.
- [x] Validar visualmente desktop e mobile antes da entrega.

## Prioridade 2 — cálculos e filtros dinâmicos

- [x] Definir regras de saldo, entradas, saídas, investimentos, faturas e comprometimento da receita. Faturas e cartões agora têm estrutura persistente para parcelas.
- [x] Implementar filtros persistentes por período, banco, categoria, pessoa e cartão. A pessoa ativa altera o perfil consultado; lançamentos, investimentos, contas e cartões possuem controles visuais de período, status, banco, categoria e cartão.
- [x] Criar agregações de dados no backend para alimentar cartões e gráficos, incluindo série diária de entradas e saídas.
- [x] Conectar tabelas, cartões de resumo e gráficos aos dados calculados. Contas, investimentos, cartões, cartões de resumo, comprometimento, gráfico e lista principal usam dados persistidos quando autenticados, com fallback visual na prévia.
- [x] Validar valores, filtros, estados vazios e testes automatizados. Check, 6 testes, build e validações desktop/mobile aprovados.

## Lacunas adicionais da Prioridade 2

- [x] Implementar agregações reais para faturas e cartões de crédito por período e cartão.
- [x] Substituir o gráfico estático por séries dinâmicas de entradas e saídas.
- [x] Conectar as tabelas de contas, investimentos e cartões aos dados persistidos.
- [x] Adicionar testes para faturas, comprometimento e séries do gráfico.

## Ajustes finais da Prioridade 2

- [x] Conectar a tela de Cartões aos dados persistidos e expor totais por cartão e período. A tela consulta cartões/compras persistidos, permite seleção por cartão e período e alterna parcela do mês/valor total.
- [x] Adicionar filtro de cartão ao contrato financeiro.
- [x] Tornar o eixo X, escala Y, labels e estado vazio do gráfico totalmente dinâmicos.
- [x] Adicionar testes para agregações de cartões e geração da série diária.

## Ajustes de validação antes do checkpoint

- [x] Adicionar teste unitário cobrindo o cálculo de comprometimento da receita.
- [x] Remover barras de fallback estáticas e exibir estado vazio real quando não houver série.
- [x] Validar visualmente o gráfico sem dados.

## Correções finais de consistência

- [x] Propagar o profileId da pessoa ativa para as queries de lançamentos, contas, investimentos e cartões.
- [x] Adicionar filtro de período real à tela de Contas.
- [x] Testar no navegador os filtros de período, banco, categoria, cartão, pessoa e status. A navegação e os controles foram verificados; a sessão sandbox sem login mostra estados vazios honestos.
- [x] Adicionar testes para filtros e estados vazios das telas conectadas.

## Evidências pendentes antes do checkpoint

- [ ] Validar em sessão autenticada os filtros de período, banco, categoria, cartão, pessoa/perfil e status com dados persistidos distintos. Pendente porque a sessão do navegador está sem login; a validação não deve ser simulada.
- [x] Ampliar a cobertura automatizada dos helpers de filtragem de contas, investimentos, cartões e lançamentos, incluindo casos sem resultados. Testes de componente/UI autenticados permanecem como evolução futura.
