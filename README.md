# RealmForge

**RealmForge** é um projeto de RPG de mesa online no navegador, com mundo persistente, mapas 2D vistos de cima, editor visual para o Mestre, multiplayer em tempo real e NPCs assistidos por IA.

## Visão do projeto

- **Jogabilidade:** campanhas multiplayer com ferramentas do Mestre, interações e consequências persistentes.
- **Cenário de referência:** uma campanha inspirada na jornada de *A Sociedade do Anel*, cobrindo Condado, Bri, Valfenda, Moria, Lothlórien e Anduin.
- **Arquitetura proposta:** React, TypeScript, PixiJS, NestJS, Socket.IO, PostgreSQL, Redis, armazenamento S3/MinIO e workers opcionais de IA.
- **Primeira entrega:** uma cena top-down jogável no navegador, com dois jogadores sincronizados, um objeto interativo e estado salvo no servidor.

## Documentação

1. [Especificação técnica v1.0](docs/chronica-especificacao-tecnica-v1.md) — arquitetura, funcionalidades, banco de dados, APIs, segurança, organização do monorepositório e roadmap.
2. [Dossiê cartográfico: A Sociedade do Anel](docs/chronica-sociedade-do-anel-roteiro-cartografico.md) — fontes, roteiro, regiões, mapas, missões e prioridades da campanha.

> **Nota de nomenclatura:** *Chronica* foi o nome provisório usado na fase de planejamento. O nome do repositório e do projeto passa a ser **RealmForge**. Os documentos originais foram preservados para manter o histórico do planejamento.

> **Direitos autorais:** referências à Terra-média, seus personagens, locais, mapas e histórias são material de estudo de uma potencial adaptação. A publicação ou distribuição de conteúdo baseado nessas obras depende de análise e, quando necessário, licença dos titulares dos direitos. Não reutilizar mapas ou ilustrações protegidos sem autorização.

## Estado atual

**Planejamento/documentação.** Ainda não há aplicação implementada ou build jogável. O próximo marco é validar o motor de mapas, a sincronização multiplayer e a persistência numa única cena.

## Primeiro marco de engenharia

1. Inicializar o monorepositório com `apps/web`, `apps/api` e `packages/contracts`.
2. Exibir o mapa inicial no PixiJS, com pan/zoom e colisões.
3. Sincronizar dois navegadores pelo Socket.IO.
4. Salvar o estado de uma interação com porta/baú no PostgreSQL.
5. Permitir ao Mestre editar e publicar camadas e objetos.
