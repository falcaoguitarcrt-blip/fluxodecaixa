# Especificação visual — Fluxo Pessoal

## Referência ground-truth

A reconstrução deve seguir fielmente as imagens enviadas pelo usuário. O produto é um dashboard financeiro pessoal chamado **Fluxo Pessoal**, com leitura visual de alta densidade, tema escuro e acentos luminosos em azul, verde, dourado e roxo conforme o contexto do perfil.

## Direção visual

A interface usa uma estética de **dashboard financeiro editorial**, combinando uma base quase preta azulada com cartões em grafite, bordas finas azul-acinzentadas, botões azuis com leve brilho e tipografia serifada de alto contraste nos títulos. No desktop, a navegação é uma barra lateral fixa; no mobile, ela se transforma em uma barra inferior fixa com cinco destinos: Início, Contas, Investir, Cartões e Casal.

Os layouts devem privilegiar painéis largos, cartões empilhados, tabelas com linhas alternadas, divisores horizontais sutis e bastante respiro entre blocos. O mobile deve preservar a hierarquia do desktop sem comprimir os controles de forma ilegível. A interface deve incluir o seletor de mês, alternância de perfil/tema, botão flutuante de adicionar, notificações contextuais e a presença da Sarinha IA.

## Elementos recorrentes

- Marca “fluxo pessoal” com símbolo de gráfico em moldura arredondada.
- Cabeçalhos em caixa alta pequena para contexto e títulos serifados para páginas e valores principais.
- Cartões com fundo grafite, raio generoso, contorno azul-cinza e sombra interna discreta.
- Azul de ação aproximado de `#3e8bd5`, azul profundo de navegação aproximado de `#173f69`, fundo aproximado de `#0c141f` e acentos de perfil em dourado e violeta.
- Estados de categoria por cor e ícone: casa em terracota, alimentação em laranja, transferências em verde, investimentos em azul.
- Transições curtas e discretas; feedback de hover, foco e clique deve ser perceptível sem competir com os dados.

## Escopo funcional reconstruído

A primeira entrega deve oferecer navegação funcional entre Visão geral, Casal, Contas, Investimentos e Cartão de crédito; filtros visuais; adicionar lançamento; cadastrar conta; cadastrar investimento; cadastrar e salvar fatura; edição contextual; exportação CSV simulada; seleção de linhas; alternância de perfil; modo claro/escuro quando presente nas referências; e estados de resumo coerentes com agosto de 2026.

## Decisões de implementação

A aplicação será uma experiência frontend responsiva com dados locais de demonstração, sem backend nesta etapa. Componentes compartilhados devem concentrar layout, navegação, cartões, filtros, tabelas, modais e estados vazios. Todos os arquivos de estilo e componentes devem preservar esta direção visual como comentário de manutenção no topo.

## Style Decisions

- A fidelidade às imagens enviadas prevalece sobre a adoção de padrões genéricos de dashboard.
- A barra lateral desktop e a barra inferior mobile são estruturas complementares, não duas páginas diferentes.
- A tipografia serifada é reservada para títulos editoriais e valores de destaque; controles e metadados usam sans-serif.
- O azul de ação é a cor proprietária da marca: `#3e8bd5`.
