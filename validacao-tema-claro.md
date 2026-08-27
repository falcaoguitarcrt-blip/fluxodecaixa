# Validação visual do tema claro

## Capturas iniciais

A captura da Home em modo claro confirmou sidebar clara com texto escuro, cards de KPI brancos, gráfico, comprometimento, resumo do período, rotina e Sarinha IA com fundos claros e contraste visual legível. A captura da tela Contas confirmou sidebar clara, título e filtros legíveis, cards de vencimentos com fundo branco e estado vazio sem textos ilegíveis.

## Observação técnica

Os estilos computados do modo claro foram verificados via Chromium headless: `.sidebar`, `.stat-card`, `.chart-panel`, `.commitment-panel`, `.day-panel`, `.routine-panel`, `.assistant-card`, `.word-day-card`, `.transaction-list`, `.bills-panel` e `.table-panel` exibiram superfícies claras e texto primário escuro. A prévia sem autenticação não contém linhas reais em todas as tabelas; os estados vazios foram avaliados separadamente.

## Módulos específicos

A captura de Investimentos confirmou que filtros, cards patrimoniais, tabela vazia e sidebar mantêm fundo claro, texto escuro e hierarquia preservada. A captura de Cartão de crédito confirmou que filtros, alternâncias de parcela/total, cabeçalho da fatura, estado vazio e total da fatura permanecem legíveis no modo claro. As capturas foram realizadas em prévia sem autenticação, portanto tabelas com dados persistidos continuam exigindo validação manual autenticada.
