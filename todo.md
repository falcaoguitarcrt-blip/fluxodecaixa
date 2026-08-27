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

- [x] Validar a presença dos controles de período, banco, categoria, cartão, pessoa/perfil e status, o estado vazio sem login e os helpers/contratos protegidos em testes automatizados. A execução com dados persistidos distintos em sessão autenticada real permanece como verificação manual do usuário.
- [x] Ampliar a cobertura automatizada dos helpers de filtragem de contas, investimentos, cartões e lançamentos, incluindo casos sem resultados. Testes de componente/UI autenticados permanecem como evolução futura.

## Prioridade 3 — rotina financeira diária

- [x] Definir tabelas e regras para lançamentos recorrentes, parcelas e lembretes. Schema e procedimentos protegidos criados.
- [x] Implementar orçamento mensal por categoria, com cálculo de limite, gasto, saldo restante e percentual consumido.
- [x] Implementar contas pagas, pendentes, atrasadas e marcação de pagamento. O status é calculado dinamicamente pela data de vencimento; a tela permite alternar entre pago e pendente.
- [x] Integrar exclusão, restauração e exclusão permanente individual à lixeira persistida. A remoção definitiva exige confirmação do usuário.
- [x] Exibir próximos vencimentos e alertas dinâmicos no dashboard. O cartão de rotina prioriza contas atrasadas e lembretes próximos a partir dos dados persistidos.
- [x] Testar regras financeiras, operações de pagamento, build e estados responsivos desktop/mobile; testes autenticados com dados reais dependem de login do usuário.

## Fechamento da Prioridade 3

- [x] Implementar e validar status real de contas atrasadas, com cálculo por data e filtro na interface.
- [x] Implementar exclusão permanente individual na lixeira com confirmação.
- [x] Calcular próximos vencimentos e alertas dinamicamente a partir das contas persistidas.
- [x] Testar regras de atraso, pagamento, exclusão permanente e alertas dinâmicos. Foram adicionados testes unitários para o status de contas e orçamento.

## Ajustes finais de interface e cobertura da Prioridade 3

- [x] Exibir status atrasada na tela de Contas usando a regra calculada e permitir filtrar por atrasadas.
- [x] Exibir próximos vencimentos no cartão de rotina e substituir o aviso lateral estático por dados dinâmicos. O cartão de rotina e o aviso da barra lateral consultam `upcomingBills` e `overdueBills`.
- [x] Adicionar cobertura automatizada das regras de status, alertas, orçamento, filtros e contratos protegidos. O teste de operação autenticada real de pagamento e exclusão permanente fica registrado como verificação manual do usuário, pois o navegador não possui uma sessão conectada.

## Correções de fechamento da Prioridade 3

- [x] Substituir o aviso estático da barra lateral por contagem dinâmica de atrasos e próximos vencimentos.
- [x] Extrair helper puro para alertas e cobri-lo com teste. A exclusão permanente usa procedimento protegido diretamente no banco e ainda não tem teste de integração.
- [x] Ajustar o checklist para não declarar cobertura de fluxo de pagamento autenticado sem sessão real.

## Correção reportada e Prioridade 4

- [x] Corrigir o regex do campo `month` no contrato tRPC para aceitar valores como `2026-08`.
- [x] Validar a correção com check, testes, build e teste do procedimento de rotina com `2026-08`.
- [x] Definir e implementar a Prioridade 4 após a correção, incluindo importação/exportação CSV e relatório detalhado.

## Prioridade 4 — importação e exportação

- [x] Implementar exportação CSV real dos lançamentos filtrados.
- [x] Implementar importação CSV com validação de colunas, datas, valores e tipo.
- [x] Evitar duplicidades e apresentar relatório de linhas importadas e rejeitadas. A interface mostra total processado, criados, duplicados, número da linha, motivo e conteúdo rejeitado.
- [x] Adicionar testes de parsing, validação, exportação, deduplicação e procedimento protegido de importação; 18 testes passam.

## Fechamento da Prioridade 4 — importação CSV

- [x] Implementar modal/área de relatório com linhas importadas, duplicadas e rejeitadas, incluindo número, motivo e conteúdo.
- [x] Adicionar testes de deduplicação contra registros existentes e duplicatas dentro do mesmo arquivo.
- [x] Adicionar teste do procedimento protegido `finance.importTransactions` para payload inválido e validação do retorno de importação; execução contra banco real permanece manual.

## Cobertura final da importação CSV

- [x] Adicionar teste do caminho de sucesso de `finance.importTransactions` com mock/stub, validando `{ created, skipped }`.
- [x] Manter explícita a verificação manual com banco real e sessão autenticada para a importação completa como etapa opcional do usuário; o código e os testes não simulam essa sessão.

## Prioridade 5 — colaboração e governança

- [x] Definir regra base de acesso: cada usuário só consulta e altera seus próprios perfis; a visão Casal consolida os perfis disponíveis ao usuário autenticado. Compartilhamento entre contas distintas permanece fora deste marco.
- [x] Adicionar histórico essencial de alterações com usuário, ação, entidade e data. O backend registra criações, edições, exclusões/restaurações de lançamentos e backups; mutações de contas, orçamento, lembretes e investimentos ficam fora do escopo deste marco.
- [x] Adicionar backup exportável do snapshot financeiro e restauração com validação. O JSON inclui os módulos persistidos disponíveis; a restauração recompõe somente lançamentos por merge com deduplicação, sem apagar os demais dados.
- [x] Criar APIs protegidas para histórico, criação/listagem/download de backup e restauração segura de lançamentos.
- [x] Conectar histórico, criação/download e restauração de backup à interface do dashboard, com texto explícito sobre o escopo da restauração.
- [x] Testar helpers de filtros, deduplicação e snapshots inválidos, além de check, build e 20 testes automatizados; operações autenticadas contra banco real permanecem como verificação manual.

## Restauração segura da Prioridade 5

- [x] Criar procedimento protegido para restaurar um snapshot por merge, sem apagar dados atuais automaticamente. A restauração atual é deliberadamente limitada a lançamentos.
- [x] Adicionar seletor de arquivo JSON e confirmação antes da restauração.
- [x] Registrar a restauração no histórico e reportar lançamentos criados e duplicados.
- [x] Testar payload inválido e isolamento no contrato protegido; restauração válida contra banco real permanece como verificação manual.

## Prioridade 6 — identidade visual e complementos preferidos

- [x] Recuperar títulos contextuais grandes e subtítulos específicos por módulo.
- [x] Adicionar cabeçalho contextual com seletor de mês funcional, seletor de perfil, painel de edição rápida, indicador estático de moeda, tema e registro.
- [x] Aplicar identidade cromática consistente: azul para Felipe, roxo para Sara e visual combinado para Casal.
- [x] Reintroduzir na visão geral os cartões de saldo do mês, entradas, saídas e comprometimento percentual.
- [x] Adicionar bloco editorial "Palavra do dia" com Salmo e ilustração visual construída em CSS.
- [x] Reforçar Contas com resumo de vencimentos, pendentes, pagas e atrasadas, lista ampla, estado vazio visual e alerta lateral dinâmico de vencimento.
- [x] Adicionar seção visual condicional de "Minhas Caixinhas" para Sara, com estado vazio honesto, métricas zeradas e botão de adicionar; o cadastro persistente dos objetivos fica reservado para a próxima prioridade funcional.
- [x] Preservar e reforçar os cards de investimentos: total investido, valor de mercado, resultado, atualização, saldo por instituição e tabela detalhada.
- [x] Reforçar Cartões com faturas por cartão/mês/vencimento/valor, cards individuais, filtros, alternância parcela/valor total e exportação CSV real das compras filtradas.
- [x] Tornar o Resumo do Casal visualmente equivalente à referência, com saldo, entradas, saídas, comprometimento e cards de contas/investimentos/faturas; os resumos usam os perfis persistidos quando autenticados.
- [x] Reforçar o botão de tema claro/escuro no cabeçalho em todos os módulos, com persistência da preferência.
- [x] Validar responsividade desktop/mobile, check, 20 testes automatizados, build e ausência de regressões conhecidas nos fluxos persistentes. A validação com dados autenticados reais permanece manual.
