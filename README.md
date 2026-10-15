# Performancejm

Crie o design responsivo do JM Dashboard DS, um painel gerencial de performance Last Mile da JM Transportes.

Visual corporativo, moderno e minimalista, com azul-marinho (#16274F), branco, cinza e verde/vermelho para indicadores. Utilize o logotipo JM (disponível em https://jmroutes.app/jm-logo-original.jpeg).

Layout:

Menu lateral compacto e cabeçalho fixo.

Página inicial: Visão Geral, exibindo automaticamente a data operacional mais recente.

Filtros por data, período, base e indicadores.

Cards: Veículos, Pacotes, Entregas, DC Cancelado, Sinistros, Insucessos, PNR e Performance.

Meta operacional: 98,2%. Verde para desempenho igual ou superior e vermelho para inferior.

Gráficos de evolução e ranking de bases.

Tabela completa com todas as 12 colunas originais (Base/Código, Tipo de Operação, Veículos, Pacotes, Entregas, DC Cancelado, Sinistros, Insucessos, PNR, Performance Logistics, Performance S/DC, Performance S/DC+Sinistro), com ordenação e filtros.

Botão destacado Importar Planilha, preparado para CSV diário (com modal drag-and-drop de importação e preview).

Páginas: Visão Geral, Histórico, Análise por Base e Importações.

Use dados demonstrativos realistas (bases ativas de Last Mile como SSP3 Campinas, SSP38 Itupeva, ESP15 XPT Ibiúna, SSP5 Barueri, SSP20 Sorocaba, SSP56 XPT Embu Guaçu, ESP16 XPT Guarujá, SSP17 ABC, SSP6 Mauá, SSP45 Itaquera, SSP15 Santos, SSP37 Campinas, SSP23 Suzano, SSC2 Biguaçu, SSP25 Atibaia, ESP18 Franco da Rocha). Priorize clareza, boa hierarquia visual e facilidade de uso.

Nesta etapa, desenvolva somente a interface. Não configure Supabase, autenticação ou backend.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://performancejm.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e2c83858-b1e3-4352-be2a-b1d7c372f0f6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
