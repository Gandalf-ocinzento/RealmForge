# RealmForge — Mapas e Percursos da Sociedade do Anel

**Edição:** 2026-11-14  
**Status:** protótipo esquemático, baseado em pesquisa; não contém mapas oficiais de Tolkien.

## Implementação

- 14 cenas 2D top-down com terreno original gerado deterministicamente por semente.
- Cada cena tem malha de 36 × 24 tiles, caminhos transitáveis, barreiras e biomas.
- 30 marcos de roteiro (atlas esquemático em SVG no navegador).
- Viagem adjacente entre cenas, validada pelo servidor; jogadores caminham até a borda oeste ou leste.
- Mudanças de terreno e abertura de portas persistem em snapshots JSONB por cena.
- Localização do jogador persiste em `player_locations`; transferências ocorrem em uma transação.
- Jogadores compartilham chat e atualizações somente com quem está na mesma cena.

### Sequência de cenas jogáveis

| Ordem | Cena | Bioma | História |
|---:|---|---|---|
| 1 | Hobbiton | Condado, colinas, casas | Partida de Frodo |
| 2 | Woody End | Bosque | Encontros na floresta |
| 3 | Bucklebury | Rio e balsa | Travessia do Brandevin |
| 4 | Floresta Velha | Bosque fechado | Caminhos tortuosos |
| 5 | Colinas dos Túmulos | Ruínas | O perigo nas colinas |
| 6 | Bri | Vila fortificada | Estalagem e Passolargo |
| 7 | Topo do Vento | Terreno rochoso | Ruínas de Amon Sûl |
| 8 | Valfenda | Vale e refúgio | Conselho de Elrond |
| 9 | Eregion | Ruínas e colinas | Início da viagem para o sul |
| 10 | Caradhras | Montanha e neve | Tentativa de passagem |
| 11 | Moria | Masmorra | Travessia subterrânea |
| 12 | Lothlórien | Bosque dourado | Refúgio élfico |
| 13 | Rio Anduin | Rio e pontes | Viagem do grupo |
| 14 | Amon Hen | Ruínas em colina | Ruptura da Sociedade |

## Limitações conhecidas

O terreno da primeira versão é **procedural e estilizado**, com caminhos e elementos retangulares. Não é uma recriação visual detalhada das localidades canônicas. Os 30 pontos no atlas possuem posições esquemáticas para facilitar navegação, **não** representam distâncias fiéis ou coordenadas oficiais. NPCs, missões, interiores e refinamento artístico ainda serão implementados.

### Notas de implementação

- O banco possui uma tabela `world_snapshots`, uma linha por cena no formato `demo:<sceneId>`.
- `player_locations` guarda a cena atual do jogador.
- Um cenário antigo salvo na chave `demo` não é excluído automaticamente; o novo esquema usa chaves separadas.
- O papel de Mestre continua selecionado no cliente. A aplicação **não deve** ser publicada sem autenticação e autorização adequadas.
- Os dados de rotas e cenas ficam em `packages/contracts/src/world-atlas.ts`.
- A geração do mapa fica em `apps/api/src/scenes.ts`.
- O atlas navegável fica em `apps/web/src/JourneyAtlas.tsx`.

## Referências

- [Tolkien Estate — mapas](https://www.tolkienestate.com/painting/maps/)
- [LOTR Project — mapa](https://lotrproject.com/map/)
- [Middle-earth Atlas — jornada](https://atlas.bag-end.eu/?journey=fellowship)

A geografia e a cronologia do roteiro são utilizadas como material de pesquisa, não como autorização de redistribuição de obras protegidas. Os tiles básicos e a apresentação esquemática foram concebidos como recursos de prototipagem.
