
## Validação visual

As capturas desktop e mobile da Home permaneceram estáveis, sem quebra de navegação, seletor de mês, seletor de perfil ou cards principais. A prévia continua sem sessão autenticada, portanto não foi possível abrir diretamente o módulo Investimentos com dados persistidos para verificar a alternância entre um mês sem aporte e o patrimônio acumulado; essa verificação permanece manual.

## Segunda revisão visual

A Home permaneceu estável em desktop e mobile após os ajustes de contrato e rótulos. O seletor de mês, perfil, tema, navegação inferior e cards principais não apresentaram quebra visual. Como a prévia continua sem sessão autenticada, a tela específica de Investimentos com dados reais não pôde ser exercitada no navegador; essa verificação permanece manual.

## Validação técnica final

`pnpm check` passou, `pnpm test` passou com **47 testes em 2 arquivos** e `pnpm build` foi concluído com sucesso. O build mantém apenas o aviso existente de chunk JavaScript acima de 500 kB; não houve erro de compilação.
