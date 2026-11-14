# RealmForge

**RealmForge** é uma plataforma de RPG de mesa multiplayer para navegador, com mapas 2D, editor visual, mundo persistente e ferramentas para o Mestre.

> **Status:** protótipo experimental local em implementação. Há código para uma primeira vila jogável; ainda não foi executado um build completo neste ambiente. O tema de *A Sociedade do Anel* permanece como referência de pesquisa, sem recursos protegidos incorporados ao protótipo.

## Tecnologias

- **TypeScript:** React + PixiJS para o cliente; NestJS + Socket.IO no servidor; contratos compartilhados.
- **PostgreSQL:** fonte de verdade do estado persistente.
- **Python:** planejado para agentes de IA em fase posterior.

Consulte a [decisão tecnológica](docs/decisao-tecnologica.md) para a comparação com Go, Rust, C# e Godot.

## Executar localmente

Requisitos: Node.js 22+, npm 10+, Docker e Docker Compose.

```bash
git clone https://github.com/Gandalf-ocinzento/RealmForge.git
cd RealmForge
cp .env.example .env
npm install
docker compose up -d
npm run dev
```

Abra **http://localhost:5173** em dois navegadores/abas e entre com nomes diferentes.

O primeiro protótipo implementa um mapa original 2D com movimento de personagens, comunicação em tempo real, chat, zoom, pintura de terrenos pelo Mestre (modo de demonstração), porta interativa e salvamento de estado no PostgreSQL.

Confira o [guia de execução e limitações](docs/executar-mvp.md).

## Estrutura

```text
apps/
  web/               React + PixiJS
  api/               NestJS + Socket.IO + PostgreSQL
packages/
  contracts/         Tipos e mensagens compartilhadas
docs/
  decisao-tecnologica.md
  executar-mvp.md
  chronica-especificacao-tecnica-v1.md
  chronica-sociedade-do-anel-roteiro-cartografico.md
```

## Documentação original

- [Especificação técnica](docs/chronica-especificacao-tecnica-v1.md) — arquitetura e roadmap.
- [Pesquisa cartográfica de A Sociedade do Anel](docs/chronica-sociedade-do-anel-roteiro-cartografico.md) — roteiro, geografia e mapas planejados.

*Chronica* era o nome provisório usado nos documentos antes de o projeto ser chamado RealmForge.


## Mapas e percursos — primeira expansão

- [Atlas geral da jornada (SVG)](assets/maps/route-atlas.svg) — rota esquemática com 30 marcos.
- [Prévias originais dos 14 mapas](assets/maps/previews/) — top-down 36 × 24 tiles, por bioma.
- [Guia dos mapas e percursos](docs/mapas-e-percursos.md) — lista de cenas, modelo de transição, persistência e limitações.
- [Dados canônicos do protótipo](packages/contracts/src/world-atlas.ts) — cenas, biomas, paradas e conexões.

No navegador, clique em **Abrir atlas da jornada** para consultar os locais. Para mudar de cena, caminhe até o extremo oeste/leste da trilha e escolha o destino vizinho na coluna lateral, ou clique no portal dourado. O Mestre (demo) pode alternar entre cenas sem caminhar até a borda.

As prévias SVG são **esquemáticas, não arte final**. As posições no atlas não seguem escala geográfica real.

## Segurança e licenciamento

**Não publique esta versão como servidor aberto.** O papel de Mestre é escolhido pelo visitante, não há autenticação, controle de acesso nem proteção contra abuso. O modo de demonstração é destinado exclusivamente ao desenvolvimento local.

A Terra-média e os elementos de *O Senhor dos Anéis* são obras protegidas. A publicação de uma adaptação ou uso de mapas/personagens licenciados exige análise dos direitos aplicáveis e das autorizações necessárias.
