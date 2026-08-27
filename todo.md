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

## Prioridade 7 — formulários e operações financeiras reais

- [x] Criar formulário persistente para editar lançamentos existentes, com validação de data, descrição, categoria, banco, tipo e valor.
- [x] Conectar o fluxo de registro/edição ao cabeçalho contextual, à lista de lançamentos e às ações dos módulos, sem placeholders enganosos para essas operações.
- [x] Criar formulário persistente de contas, com descrição, valor, vencimento, responsável e status.
- [x] Criar formulário persistente de investimentos, com descrição, categoria, instituição, valor investido, valor de mercado e data.
- [x] Criar formulário persistente de cartões, com nome, bandeira, dia de fechamento e dia de vencimento. O schema atual não possui campo de limite; o formulário não inventa esse dado.
- [x] Criar formulário persistente de compras/faturas de cartão, com cartão, descrição, categoria, data, valor total, parcelas e parcela atual.
- [x] Adicionar validações de domínio e mensagens de erro/sucesso nos formulários da Prioridade 7.
- [x] Invalidar as consultas relacionadas após cada criação ou edição e refletir os dados na interface sem recarregar a página.
- [x] Registrar as novas criações e edições no histórico de auditoria, respeitando o usuário e perfil ativos.
- [x] Cobrir contratos novos com testes Vitest; validar check, 24 testes, build e responsividade desktop/mobile. Testes de persistência autenticada real permanecem como validação manual.

## Correções de fechamento da Prioridade 7

- [x] Ajustar o escopo do botão de ajustes do cabeçalho para comunicar que ele controla apenas a visualização; a edição financeira permanece nas listas e nos formulários de cada módulo.
- [x] Adicionar refinamento server-side em compras de cartão para garantir `currentInstallment <= installments` também via API.
- [x] Adicionar testes Vitest para a regra server-side de parcelas inconsistentes.
- [x] Registrar como limitação do ambiente a validação manual dos modais autenticados: a prévia sandbox não disponibiliza login, portanto a validação real de sessão fica fora do ambiente atual.

## Prioridade 8 — Minhas Caixinhas da Sara

- [x] Criar tabela persistente de objetivos de caixinha vinculada ao usuário e perfil Sara.
- [x] Adicionar operações protegidas para listar, criar, editar, arquivar e excluir caixinhas, com validação de perfil.
- [x] Registrar criações, edições, arquivamentos e exclusões de caixinhas no histórico de auditoria.
- [x] Incluir caixinhas no snapshot de backup e manter a restauração geral explicitamente limitada a lançamentos.
- [x] Implementar formulário persistente com nome do objetivo, categoria, meta, valor guardado, prazo e observações.
- [x] Exibir métricas reais de objetivos ativos, valor guardado e progresso, com estado vazio honesto.
- [x] Conectar a seção condicional de Sara ao cadastro, edição e arquivamento de caixinhas.
- [x] Adicionar testes de validação, cálculo de progresso, isolamento por perfil e contratos tRPC; a validação de isolamento com banco real permanece manual.
- [x] Validar migração aplicada, check, 28 testes, build e responsividade desktop/mobile.

## Fechamento da Prioridade 8

- [x] Adicionar teste automatizado da barreira de acesso Sara e do contrato de listagem para perfil inválido; a validação com IDs reais de outro usuário permanece protegida pelo helper de acesso e fica como verificação manual autenticada.

## Cobertura adicional de acesso da Prioridade 8

- [x] Cobrir os contratos tRPC com rejeição direta de chamadas declaradas para perfil Felipe e cobrir a regra compartilhada para perfil Felipe válido e perfil pertencente a outro usuário; a confirmação com registros reais permanece manual autenticada.

## Prioridade 9 — visão Casal consolidada

- [x] Mapear a visão Casal atual e definir os indicadores consolidados sem usar valores fictícios.
- [x] Criar helper de agregação para combinar Felipe e Sara por mês, incluindo saldo, entradas, saídas e comprometimento.
- [x] Expor procedimento tRPC protegido para o resumo consolidado do casal, respeitando usuário e perfis disponíveis.
- [x] Consolidar patrimônio investido, valor de mercado, resultado e instituições dos dois perfis.
- [x] Consolidar faturas e parcelas por cartão, mês e perfil, mantendo cartões individuais identificáveis.
- [x] Recompor a interface Casal com cards financeiros, comparativo Felipe/Sara e estados vazios honestos.
- [x] Adicionar indicadores de distribuição por perfil e explicação de como o casal é calculado.
- [x] Validar mês global, responsividade desktop/mobile e ausência de dados inventados em prévia sem autenticação; dados reais ficam para a sessão manual do usuário.
- [x] Cobrir agregações, estado vazio, validação de mês e acesso protegido por usuário/perfil com 30 testes Vitest; executar check, testes e build. A execução com banco autenticado real permanece manual.

## Fechamento da Prioridade 9

- [x] Expor no consolidado o valor efetivamente investido e o resultado agregado de investimentos, calculado como valor de mercado menos valor investido.
- [x] Adicionar teste do procedimento tRPC da visão Casal para mês inválido/estado vazio, além de cobertura do filtro de usuário e da consolidação somente de Felipe/Sara; a validação com dados reais de múltiplos usuários permanece manual autenticada.

## Prioridade 10 — cartões detalhados e faturas

- [x] Revisar os dados persistidos de cartões e compras para definir fatura, vencimento, fechamento e estado sem valores fictícios; compras sem registro aparecem como sem compras, e não como uma fatura paga inventada.
- [x] Criar agregação detalhada por cartão com compras internas, parcela do mês, valor total, vencimento e estado.
- [x] Expor ou ajustar contratos protegidos para consulta detalhada por mês, cartão e categoria; o resumo protegido inclui os dados derivados de cada fatura.
- [x] Reforçar a interface com cards individuais de cartão, marca, fatura, compras internas, vencimento e estado.
- [x] Adicionar filtros reais por mês, cartão e categoria, preservando a alternância entre parcela do mês e valor total.
- [x] Permitir editar cartão e compra a partir dos detalhes, com atualização das consultas e auditoria.
- [x] Manter exportação CSV das compras filtradas e estados vazios honestos.
- [x] Cobrir agregações, estados, filtros e contratos com 32 testes Vitest; executar check, testes, build e revisão responsiva.

## Refinamento de fechamento da Prioridade 10

- [x] Centralizar no backend o detalhamento de faturas por cartão, com valor da parcela, valor total, quantidade de compras, vencimento derivado e estado da fatura.
- [x] Usar o detalhamento de faturas no resumo protegido e cobrir o cálculo com testes Vitest.

## Prioridade 11 — operações contextuais e fluxos separados

- [x] Adicionar menu contextual por botão direito nos lançamentos, com editar, excluir e fechar ao clicar fora ou pressionar Escape.
- [x] Implementar exclusão de lançamento dentro do fluxo de edição, com confirmação e envio para a lixeira/auditoria.
- [x] Garantir que edição e exclusão respeitem o usuário e o perfil financeiro ativos por meio dos procedimentos protegidos existentes.
- [x] Criar configuração persistente de categorias de entrada e saída, com adicionar, renomear, arquivar e exclusão protegida quando houver uso.
- [x] Usar as categorias configuradas no formulário de lançamentos, filtros e listas sem perder categorias históricas.
- [x] Separar claramente os fluxos de lançamento comum, investimento, cartão e conta na página principal, com ações rápidas e feedback próprios.
- [x] Corrigir o fluxo de investimentos para salvar e atualizar os dados sem convertê-los em lançamento comum, usando o formulário e procedimento próprios.
- [x] Garantir atualização das consultas, cálculos e auditoria após cada operação.
- [x] Adicionar testes para contratos de exclusão e categorias, além das barreiras de perfil; validar check, 34 testes, build e responsividade. A interação de botão direito permanece validada visualmente e deve ser conferida manualmente pelo usuário.

## Auditoria solicitada — Contas e lançamentos mensais

- [x] Mapear na tela Contas todos os filtros, estados, ações e dependências do mês global.
- [x] Verificar se lançamentos, contas, recorrências, cartões e investimentos aparecem somente no mês pertinente ao seu lançamento ou vencimento.
- [x] Auditar riscos de duplicidade, datas UTC/local, conversão de valores, parcelas, status pago/pendente/atrasado e exclusões.
- [x] Comparar os contratos tRPC, helpers de banco e cálculos da Home com o comportamento visual da tela.
- [x] Executar testes e inspeções sem alterar dados persistidos; check e 34 testes passaram.
- [x] Produzir diagnóstico priorizado com riscos, impactos, correções recomendadas e testes necessários antes de implementar; implementação da Prioridade A aguarda aprovação.

## Prioridade A — calendário e filtragem mensal

- [x] Criar helpers únicos para validar semanticamente `YYYY-MM`, obter a chave mensal de uma data e formatar datas civis sem deslocamento indevido de fuso.
- [x] Corrigir a tela Contas para calcular vencimentos, pendentes, pagas e atrasadas somente no mês selecionado, sem fallback numérico artificial.
- [x] Remover mês fixo de agosto de 2026 dos cabeçalhos, seletores e consultas da Sidebar, usando o mês global.
- [x] Tornar os alertas e o cartão de rotina dependentes do mês global, com distinção clara entre atrasos e próximos vencimentos.
- [x] Atualizar filtros de lançamentos, investimentos e cartões para usar os helpers de mês e preservar a competência correta.
- [x] Adicionar testes de mês sem registros, meses anterior/posterior, datas-limite, status e fuso brasileiro.
- [x] Validar check, testes, build e responsividade sem alterar os dados financeiros existentes.

## Prioridade 2 da auditoria — governança de pagamentos e perfis

- [x] Revisar o diagnóstico e mapear o fluxo atual de pagamento/status de contas.
- [x] Garantir que marcar ou reabrir uma conta valide usuário, perfil e competência antes de alterar o registro.
- [x] Registrar pagamento, reabertura e alteração de status com evento de auditoria consistente.
- [x] Reforçar a invalidação das consultas relacionadas à tela Contas, rotina, Sidebar, casal e histórico.
- [x] Corrigir estados visuais para refletir status derivado sem permitir inconsistência entre status salvo e status exibido.
- [x] Adicionar testes de isolamento por perfil, pagamento/reabertura, auditoria e cache lógico.
- [x] Validar check, testes, build e responsividade sem alterar dados financeiros existentes.

## Prioridade 3 da auditoria — recorrências mensais idempotentes

- [x] Revisar o modelo atual de regras recorrentes, lançamentos e vínculo de perfil.
- [x] Definir identidade única por regra recorrente, competência e ocorrência.
- [x] Materializar ocorrências somente para o usuário/perfil autorizado e mês solicitado.
- [x] Evitar duplicidades em chamadas repetidas e preservar edição/status da ocorrência criada.
- [x] Integrar a materialização ao bootstrap e à tela Contas sem misturar fluxos financeiros.
- [x] Adicionar testes de mês, datas-limite, perfil, idempotência e duplicidade.
- [x] Validar migração, check, testes, build e responsividade sem alterar dados existentes.

## Nova auditoria comparativa — Contas, lançamentos e investimentos da Sara

- [x] Revisar a implementação atual da tela Contas, lançamentos mensais e investimentos da Sara.
- [x] Verificar isolamento por perfil, competência, status, datas, valores, parcelas e duplicidades.
- [x] Comparar regras comuns e diferenças necessárias entre Felipe, Sara e Casal.
- [x] Executar check, testes e inspeções sem alterar código funcional ou dados financeiros.
- [x] Produzir diagnóstico priorizado com riscos, impactos e recomendações antes de implementar.

## Melhoria patrimonial — aportes mensais versus patrimônio acumulado

- [x] Definir e documentar a diferença entre aporte da competência e patrimônio acumulado.
- [x] Implementar agregações patrimoniais por perfil sem misturar dados de Felipe e Sara.
- [x] Atualizar cards e tabela de Investimentos para mostrar aporte mensal e patrimônio acumulado com rótulos claros.
- [x] Atualizar a visão Casal com aportes do mês e patrimônio consolidado.
- [x] Preservar caixinhas da Sara como saldo/progresso acumulado, sem zerar na troca de mês.
- [x] Adicionar testes para meses sem aporte, investimentos antigos, perfis e estados vazios.
- [x] Validar check, testes, build e responsividade sem alterar dados existentes.

## Auditoria — Cartão de crédito

- [x] Revisar a implementação atual de cartões, compras e faturas.
- [x] Verificar competência mensal, fechamento, vencimento, parcelas, valor da parcela e valor total.
- [x] Auditar filtros, estados, edição, exportação, perfis e visão Casal.
- [x] Verificar riscos de duplicidade com lançamentos comuns e contas.
- [x] Executar check, testes e inspeções sem alterar código ou dados financeiros.
- [x] Produzir diagnóstico priorizado antes de implementar correções.

## Correção de tema claro e contraste AA

- [x] Auditar variáveis de tema e cores fixas na sidebar, cards, gráficos e tabelas.
- [x] Substituir fundos, textos, bordas e legendas hardcoded por tokens semânticos responsivos.
- [x] Corrigir sidebar e cards internos: gráfico, resumo do período, Sarinha IA, rotina e comprometimento.
- [x] Validar cards de KPI, gráfico de barras, Palavra do período, lançamentos, investimentos e cartão nos dois temas.
- [x] Verificar contraste mínimo AA de textos, valores, uppercase e legendas.
- [x] Executar testes, check, build e validação desktop/mobile.

## Correção — fonte única do consolidado Casal

- [x] Auditar a Visão Geral e a aba Casal para localizar a divergência de fonte ou filtro.
- [x] Reutilizar uma única função de consolidação para os dois caminhos.
- [x] Garantir que o perfil Casal some Felipe e Sara no mês selecionado, sem fallback zero indevido.
- [x] Adicionar teste automatizado de equivalência dos KPIs entre Visão Geral e aba Casal.
- [x] Executar check, testes, build e validação visual desktop/mobile.

## Identidade cromática distinta do perfil Casal

- [x] Auditar os seletores atuais de perfil no cabeçalho, sidebar, registro e avatar.
- [x] Definir tokens teal/dourados para Casal em modo claro e escuro.
- [x] Aplicar a cor distinta no badge superior, botão registrar, ativo da sidebar e indicador inferior.
- [x] Garantir que Felipe permaneça azul e Sara permaneça roxo/magenta.
- [x] Validar contraste, responsividade, testes e build.

## Estados vazios reutilizáveis

- [x] Auditar os estados sem dados de Contas, Cartão, Investimentos e Lançamentos.
- [x] Criar componente reutilizável com ícone, título, apoio e ação primária interna.
- [x] Aplicar o componente a Contas, Cartão de crédito, Investimentos e Lançamentos.
- [x] Adaptar a área de fatura quando não houver cartão cadastrado.
- [x] Adicionar testes de presença, rótulo e callback das ações vazias.
- [x] Validar os dois temas, desktop/mobile, check, testes e build.

## Contextualização do resultado acumulado em Investimentos

- [x] Auditar a origem do valor investido e do valor de mercado usados no card.
- [x] Detectar aporte positivo com valor de mercado zerado no período e filtros ativos.
- [x] Exibir aviso discreto abaixo de Resultado acumulado sem mascarar o cálculo.
- [x] Adicionar testes para mercado desatualizado, ativo normal e múltiplos ativos.
- [x] Validar temas, responsividade, check, testes e build.

## Alerta visual de contas atrasadas

- [x] Auditar a composição atual dos cards de Contas e a ordem da grade.
- [x] Aplicar estado de alerta condicional somente quando houver contas atrasadas.
- [x] Destacar o sino com tratamento sutil e preservar contraste nos dois temas.
- [x] Priorizar Atrasadas na primeira posição quando o total for maior que zero.
- [x] Adicionar testes de estado, ordem e neutralidade quando o total for zero.
- [x] Validar responsividade, check, testes e build.

## Auditoria geral de acessibilidade e responsividade

- [x] Mapear as cinco abas e seus componentes interativos, grades, tabelas e navegação.
- [x] Auditar contraste WCAG AA e uso de tokens semânticos em estados claro e escuro.
- [x] Auditar áreas clicáveis mínimas de 44×44 px e estados de foco visível.
- [x] Auditar navegação por teclado nos seletores de período e perfil e demais controles.
- [x] Auditar comportamento responsivo da sidebar, grids e tabelas abaixo de 768 px.
- [x] Validar desktop, tablet e mobile com evidências visuais sem aplicar correções.
- [x] Gerar relatório priorizado com achados, impacto e recomendações antes de corrigir.

## Confirmação da consolidação Casal na Visão Geral

- [x] Auditar a query e o helper usados pelos KPIs da Visão Geral quando o perfil Casal está ativo.
- [x] Comparar com a fonte de dados e o cálculo da aba dedicada Casal no mesmo período.
- [x] Unificar a fonte de verdade se houver qualquer divergência de lógica ou query.
- [x] Adicionar ou atualizar teste automatizado de equivalência dos quatro KPIs.
- [x] Validar visualmente a Visão Geral com Casal selecionado e capturar print para conferência.
- [x] Registrar o resultado e salvar checkpoint.

## Auditoria e correção do modo claro — retomada após reinício

- [x] Auditar novamente tokens e cores hardcoded na Visão Geral, Contas, Investimentos e Cartão para Felipe, Sara e Casal.
- [x] Corrigir superfícies, textos e ícones dos componentes-alvo para tokens semânticos responsivos.
- [x] Garantir contraste WCAG AA mínimo de 4,5:1 no modo claro.
- [x] Atualizar testes automatizados de tokens e contraste.
- [x] Validar as quatro abas em modo claro e capturar prints para conferência.
- [x] Salvar checkpoint final da correção.

## Contraste do alerta de vencimentos na sidebar

- [x] Auditar os tokens e estados do card “Nenhum vencimento crítico”.
- [x] Ajustar contraste de superfície, título, detalhe e ícone nos modos claro e escuro.
- [x] Adicionar teste automatizado de contraste WCAG AA para o componente.
- [x] Validar visualmente a sidebar nos dois temas e salvar checkpoint.
