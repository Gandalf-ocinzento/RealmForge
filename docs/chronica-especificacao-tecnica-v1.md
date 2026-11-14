# CHRONICA — Especificação Técnica v1.0

**Produto:** plataforma web de RPG de mesa online com mundo persistente e IA.  
**Tema:** medieval histórico, sem magia obrigatória; campanha-piloto fictícia inspirada na Península Ibérica, c. 1250.  
**Visual:** mapas 2D top-down de alta definição, com camadas, zoom, edição e interações.  
**Estado:** projeto arquitetural, não implementação concluída.  
**Público do MVP:** 1 Mestre + 2–8 jogadores, por campanha/sala.

## 1. Objetivo do produto

Permitir criar campanhas, convidar jogadores, editar mapas, controlar personagens e NPCs, interagir com ambientes e preservar as consequências de ações entre sessões. IA é opcional, contextual e submetida a permissões. Cada campanha é uma instância independente de mundo (não um MMO global).

### História vertical inicial

1. Mestre cria a campanha **Fronteira de 1250** e convida dois jogadores.
2. Mestre edita um mapa de vila, pinta estrada/terreno, coloca taverna, NPC e baú; publica a versão.
3. Jogadores entram no mesmo mapa, veem tokens em tempo real, movem-se e trocam mensagens.
4. Um jogador abre um baú e pega um item. Servidor valida permissão/proximidade; item passa ao inventário e baú permanece vazio após reload.
5. Jogador conversa com NPC; IA redige resposta consistente com informações visíveis, mas não pode inventar efeitos permanentes sem autorização.
6. Mestre avança o relógio, abre um evento e salva a sessão. O mundo mantém as alterações.

## 2. Princípios / decisões

- **Autoridade do servidor:** clientes enviam intenções; servidor valida, aplica, persiste e transmite eventos.
- **Persistência real:** PostgreSQL é fonte de verdade; Redis mantém estados efêmeros e tarefas; objetos binários vão ao storage S3/MinIO.
- **Monólito modular:** uma API NestJS, um app React/Vite e workers separados, evoluindo apenas quando houver demanda.
- **Sem IA no caminho crítico:** movimento, dados, inventário, combate e persistência funcionam com IA desconectada.
- **História auditável:** cada alteração relevante registra ator, campanha, ação, tempo e versão.
- **Mundo histórico:** conjunto de regras original com ocupações, status, saúde, equipamentos e reputação; sem copiar conteúdo protegido de sistemas de RPG comerciais.
- **Visibilidade:** dados secretos de Mestre e névoa de guerra filtrados no backend por usuário.

## 3. Escopo do MVP e fora de escopo

**MVP — obrigatório**: contas, login, papéis (owner/gm/player/observer); criação e convite para campanhas; criação/importação de mapas top-down em tiles; edição de camadas/objetos; salvamento e publicação; salas em tempo real; movimento com colisão; chat; ficha mínima; rolagem de dados no servidor; portas, baús, itens, pontos de cena; NPC manual; snapshots, histórico e restauração após reinício; console do Mestre; NPC com diálogo de IA opcional; autorização e trilha de auditoria.

**Pós-MVP:** continentes navegáveis em mapas geográficos; neblina de guerra avançada, visão dinâmica e luz; editor multiusuário CRDT; economia simulada detalhada; árvores de genealogia; batalhas táticas complexas; áudio/vídeo integrado; aplicativo mobile nativo; mundos compartilhados entre milhares de usuários; geração automática de mapas por IA.

## 4. Experiência / telas

- `/login`, `/register`: autenticação.
- `/dashboard`: minhas campanhas, criar campanha, convites.
- `/campaigns/:id`: personagens, membros, sessões, configurações e botão entrar.
- `/game/:campaignId/:sceneId`: canvas central; barra esquerda (personagens/ferramentas); direita (ficha/chat/eventos); barra superior (mapa, relógio, sessão); rodapé (dados/ações).
- `/editor/:mapId`: painel de camadas, pincel, seleção, carimbo, propriedades, histórico, versões, publicar.
- `/gm/:campaignId`: cena ativa, revelar/ocultar informações, controlar NPCs, teletransportar tokens, desencadear eventos, aprovar ações da IA, fazer rollback controlado.

## 5. Mapa detalhado

### 5.1 Modelo

- `world` -> `region` -> `map` -> `scene` (região, vila, interior ou masmorra).
- Mesma convenção cartesiana em cada mapa: origem `(0,0)` no canto superior esquerdo, unidades em *tiles*; `tileSize=64px` (padrão inicial; configurável por mapa).
- Chunks `16x16` tiles por camada (1024px por chunk em resolução 1x), incluindo índices negativos se mapa infinito.
- Camadas ordenadas: `terrain`, `roads`, `decor`, `structures`, `collision`, `interactive`, `light`, `gm-secret`; IDs estáveis e ACL por camada.
- Tilesets em WebP/PNG atlas com metadados e IDs; mipmaps/LODs de arte por faixa de zoom quando houver assets.
- Não redimensionar uma imagem gigante: carregar apenas chunks visíveis + margem, com cache/LRU e descarte de texturas.
- Zoom de câmera de 0,25× a 4× no MVP. Troca de escala **world/region/scene** por *portal*/seleção de ponto de interesse, não pela ampliação simples de pixels.
- Object layer com `x, y, width, height, rotation, visible, kind, properties`, collision shape e gatilho de interação.

### 5.2 Editor

**MVP:** pincel, borracha, preencher região limitada, seleção, mover objeto, importar tileset, grid on/off, layers visíveis, colisão, undo/redo local, salvamento versionado, prévia como jogador e publicação explícita. Só Mestre/Editor alteram; editor usa bloqueio por chunk/cena no MVP.

**Publicação:** mapa rascunho -> validação (assets, referências, colisões, portais) -> snapshot versionado -> `map.published` -> clientes recebem nova versão ou trocam de cena sem sobrescrever edições em andamento. Se jogadores ativos, Mestre confirma atualização para não interromper combate.

**Interações:** scripts declarativos tipados, nunca JavaScript arbitrário de usuário. Ex.: `door.toggle`, `container.open`, `item.pickup`, `scene.portal`, `npc.talk`, `gm.trigger`. Toda ação exige validação de proximidade, ACL, condições, estado e limite de frequência.

### 5.3 Navegação

Clique para mover -> servidor calcula/valida caminho (A* em grid/collision data), velocidade e controle do personagem -> atualiza estado -> envia posições/snapshots a clientes autorizados. No MVP, movimento discreto por tiles ou destinos com interpolação visual. O servidor nunca confia no destino instantâneo informado pelo cliente. Portais levam a mapas/cenas distintos com posição de spawn associada.

## 6. Multiplayer e sincronização

- HTTPS para CRUD/upload e consulta; Socket.IO para presença, intenções e difusão de alterações.
- Rooms: `campaign:{id}`, `scene:{id}`, `gm:{campaignId}` com ingresso autenticado e validado.
- Mensagens possuem `schemaVersion`, `commandId` (UUID para idempotência), `campaignId`, `sceneId`, `baseRevision`, `payload`.
- Fluxo: autenticado -> subscribe cena -> snapshot autorizado e revisão -> comandos -> validações -> transação de banco de estado + event log -> ACK -> broadcast de evento com sequência monotônica por campanha.
- Conflito de revisão: rejeitar ou reaplicar somente comandos com semântica definida; nunca fazer last-write-wins para inventário.
- Reconexão: token atualizado, último `eventSeq` conhecido, recuperação de eventos se disponíveis; senão snapshot e nova sequência. Mecanismo nativo de recovery do Socket.IO é auxiliar, não substitui ressincronização de estado.
- MVP uma instância da API; escalonamento horizontal posterior com Redis Streams adapter ou outro mecanismo compatível com recovery conforme requisitos. O adapter Redis Pub/Sub convencional não oferece connection-state recovery.

### 6.1 Exemplo de comando

```json
{
  "schemaVersion": 1,
  "commandId": "ef26657e-65d9-4bd4-8b28-41f95cd0a537",
  "campaignId": "camp_01",
  "sceneId": "scene_village",
  "baseRevision": 42,
  "type": "object.interact",
  "payload": {"objectId": "chest_17", "action": "open"}
}
```

Resposta de sucesso:

```json
{
  "commandId": "ef26657e-65d9-4bd4-8b28-41f95cd0a537",
  "status": "applied",
  "eventSeq": 1084,
  "revision": 43
}
```

Evento para clientes autorizados: `world.object.updated` (campos permitidos apenas). Em falha: `status: rejected`, código `NOT_IN_RANGE|FORBIDDEN|REVISION_CONFLICT|INVALID_STATE`.

## 7. Máquina de estados, economia de simulação e regras

O `WorldEngine` executa comandos no servidor. `WorldClock` mantém tempo fictício (data e hora do universo, fator de aceleração e pausas). Workers processam eventos agendados de forma idempotente (`event id` + estado transacional). Ao voltar de inatividade, aplicar simulação agregada limitada, não milhões de ticks para cada minuto offline.

**NPCs:** identidade, posição, ocupação, horário, relação por jogador/campanha, rumores conhecidos, objetivos e último evento. NPCs distantes podem ser atualizados com simulação simplificada por agenda; NPCs próximos têm comportamento mais detalhado. A IA gera diálogo quando solicitada; regras e relógio são determinísticos no backend.

**Sistema mínimo:** atributos (vigor, destreza, percepção, influência e conhecimento); condições; itens; perícias; ações de dados `1d20+modificador`, com transparência de fórmula, modificadores e resultado. Definir uma licença e regras próprias antes de expandir.

## 8. Modelo de dados

| Entidade | Campos essenciais | Relacionamentos |
|---|---|---|
| `users` | id, email, password_hash, created_at | memberships, characters |
| `campaigns` | id, owner_id, title, setting, world_clock, revision | members, worlds, events |
| `campaign_members` | campaign_id, user_id, role, status | users, campaigns |
| `worlds` / `regions` | id, campaign_id, name, metadata | maps |
| `maps` | id, world_id, region_id, tile_size, extent, published_version_id | map_versions |
| `map_versions` | id, map_id, version, status, author_id, created_at | chunks, layers |
| `map_layers` | id, map_version_id, type, z_index, visibility_acl | chunks, objects |
| `map_chunks` | id, layer_id, cx, cy, content_hash, storage_key | layers |
| `scenes` | id, campaign_id, map_version_id, status | tokens, objects |
| `scene_objects` | id, scene_id, kind, position, state_json, revision | interactions |
| `characters` | id, campaign_id, user_id, attributes_json, inventory_revision | tokens, inventory |
| `tokens` | id, scene_id, character_id/npc_id, x, y, facing | scene |
| `npcs` | id, campaign_id, profile_json, relations_json, memory_revision | scenes |
| `inventory_items` | id, owner_type, owner_id, item_type, amount, metadata | characters/objects |
| `event_log` | id, campaign_id, seq, command_id, actor_id, event_type, payload_json, occurred_at | campaigns |
| `snapshots` | id, campaign_id, seq, state_ref, created_at | event_log |
| `ai_proposals` | id, campaign_id, actor_id, tool_name, proposal_json, status, approved_by | event_log |
| `assets` | id, owner_id, hash, storage_key, mime, width, height | maps |
| `fog_visibility` | scene_id, player_id, encoded_visible_cells, revision | scenes/users |
| `dice_rolls` | id, campaign_id, actor_id, notation, result_json, visibility | event_log |

Constraints: `unique(campaign_id, seq)` em `event_log`, `unique(campaign_id, command_id)` para idempotência, `unique(layer_id,cx,cy)` em chunks, chave de pertencer à mesma campanha em referências cruzadas. Índices em `scene_id`, `campaign_id`, `map_version_id`, `occurred_at`. Uso de transações e bloqueio otimista por `revision`. Senhas com Argon2id via biblioteca consolidada; chaves/tokens fora do banco em texto claro.

SQL esquemático:

```sql
CREATE TABLE event_log (
  id uuid PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  seq bigint NOT NULL,
  command_id uuid NOT NULL,
  actor_id uuid REFERENCES users(id),
  event_type text NOT NULL,
  payload_json jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, seq),
  UNIQUE (campaign_id, command_id)
);
CREATE INDEX event_log_recent ON event_log (campaign_id, occurred_at DESC);
```

É um esboço conceitual, não uma migração executável isolada (depende das tabelas `campaigns` e `users`).

## 9. API REST e eventos

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/v1/auth/register` | criar conta |
| `POST` | `/v1/auth/login` | iniciar sessão |
| `GET/POST` | `/v1/campaigns` | listar/criar campanha |
| `POST` | `/v1/campaigns/:id/invites` | convidar membro |
| `GET` | `/v1/campaigns/:id/state` | snapshot autorizado |
| `GET/POST` | `/v1/campaigns/:id/maps` | listar/criar mapas |
| `GET` | `/v1/maps/:id/versions/:version` | metadados de mapa |
| `PUT` | `/v1/maps/:id/draft/chunks/:cx/:cy` | salvar chunk de rascunho com `If-Match` |
| `POST` | `/v1/maps/:id/publish` | publicar nova versão |
| `POST` | `/v1/assets/presign` | URL assinada para upload |
| `GET` | `/v1/campaigns/:id/events?after=...` | eventos filtrados |
| `POST` | `/v1/campaigns/:id/ai/proposals` | solicitar proposta de IA |
| `POST` | `/v1/ai/proposals/:id/approve` | aprovação de Mestre |

WS cliente -> servidor: `scene.join`, `token.move.request`, `object.interact.request`, `dice.roll.request`, `chat.send`, `gm.command.request`, `presence.update`.

WS servidor -> cliente: `scene.snapshot`, `world.event`, `command.ack`, `presence.changed`, `chat.message`, `gm.notification`, `scene.resync.required`. Chat e resultados secretos devem ser roteados apenas a audiência autorizada.

## 10. IA, agentes e controle

**Worker Python** lê contexto autorizado via API interna: campanha, personagens visíveis, cenário, histórico resumido, conhecimento do NPC e intenção do jogador. O modelo retorna **propostas estruturadas**, nunca SQL, shell ou comandos irrestritos.

Papéis de agentes (podem ser workflows antes de agentes separados):

- **Narrador**: sugestões de cenas e resumos de sessão.
- **NPC**: diálogo condicionado a personalidade, conhecimento e relacionamento.
- **Cronista**: resumo periódico de eventos persistidos.
- **Historiador**: sinaliza incoerências temporais/regionais e apresenta fontes quando disponíveis.
- **Diretor de Mundo**: propõe acontecimentos econômicos/políticos agendados para aprovação.

Ferramentas permitidas de leitura: `read_scene_context`, `read_npc_profile`, `list_recent_events`, `lookup_historical_reference`. Ferramentas de proposta: `propose_dialogue`, `propose_quest`, `propose_world_event`. Mutação de mundo: `gm_approve_proposal` + `WorldEngine` autoritativo. IA não tem credenciais de escrita direta no banco.

**Exemplo de proposta:**

```json
{
  "type": "propose_world_event",
  "campaignId": "camp_01",
  "sceneId": "scene_village",
  "suggestedEvent": "market_price_change",
  "reason": "A estrada foi bloqueada por dois dias",
  "payload": {"commodity": "grain", "priceDeltaPct": 10},
  "requiresApproval": true
}
```

Guardrails: validação por esquema, autorização por ferramenta e campanha, limite de tokens e custos, timeout, rate limit, sanitização de prompts recuperados, proteção a prompt injection em chat/NPC, logs com retenção definida e consentimento para uso de dados em serviços externos. Jamais enviar segredo do Mestre ao contexto de jogador/NPC sem autorização.

## 11. Segurança e privacidade

- HTTPS/TLS, cookies HttpOnly/Secure/SameSite ou tokens de curta duração com renovação segura.
- Hash de senha Argon2id, proteção de login, recuperação de acesso por token de uso único e MFA opcional pós-MVP.
- AuthZ por campanha e papel em cada REST/WS; não confiar em IDs do cliente para autorização.
- Segredos de mapas e NPCs são filtrados **antes** do snapshot e da emissão WS; camadas ocultas não são entregues ao navegador.
- Sanear texto e Markdown contra XSS; upload com validação de MIME/conteúdo, tamanho, cota e URLs assinadas; não executar scripts fornecidos por campanhas.
- Rate limits, idempotência, telemetria, backups cifrados, logs estruturados, retenção e exclusão de dados conforme políticas locais.
- Observabilidade: traces, logs, métricas de reconexão, WS RTT, FPS cliente, tempo de salvamento, filas de IA, erros.

## 12. Testes e critérios de aceite

Testes unitários do motor de regras, validadores de intenção, permissões, inventário e relógio. Testes de integração para transações, idempotência e concorrência; E2E de navegador com Playwright; testes de carga em várias salas com clientes sintéticos; reconexão, rollback, restart e migrações.

Metas iniciais (a verificar em hardware real e com carga definida):

- Sala com 1 Mestre + 8 jogadores funcionais em desktops modernos.
- 60 FPS esperado em cena demonstrativa moderada; degradar com elegância em máquinas lentas.
- Atualização de movimento em rede local abaixo de 150 ms no p95 (incluindo servidor, não Internet pública); meta de engenharia, não garantia.
- Persistência de interações críticas antes do ACK de sucesso.
- Reentrada após restart preserva posição, inventário, baús, objetos e evento recente.
- Atualização do editor em chunks sem corromper versão publicada.
- Jogadores nunca recebem segredos invisíveis do Mestre nas respostas ou WS.
- IA desligada não impede ações básicas de jogo.

## 13. Estrutura do monorepositório

```text
chronica/
├── apps/
│   ├── web/                       # React/Vite
│   │   ├── src/
│   │   │   ├── app/               # rotas, providers, layout
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── characters/
│   │   │   │   ├── gm-console/
│   │   │   │   ├── editor/
│   │   │   │   ├── inventory/
│   │   │   │   └── chat/
│   │   │   ├── game/
│   │   │   │   ├── engine/         # Pixi scene/render loop
│   │   │   │   ├── camera/
│   │   │   │   ├── tilemap/
│   │   │   │   ├── entities/
│   │   │   │   ├── interactions/
│   │   │   │   ├── input/
│   │   │   │   └── networking/
│   │   │   └── shared/
│   │   └── public/
│   ├── api/                       # NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── memberships/
│   │   │   │   ├── worlds/
│   │   │   │   ├── maps/
│   │   │   │   ├── assets/
│   │   │   │   ├── world-engine/
│   │   │   │   ├── realtime/
│   │   │   │   ├── characters/
│   │   │   │   ├── encounters/
│   │   │   │   ├── events/
│   │   │   │   ├── gm-tools/
│   │   │   │   └── ai-gateway/
│   │   │   ├── common/
│   │   │   └── main.ts
│   │   └── prisma/
│   │       └── migrations/
│   └── ai-worker/                 # Python, isolado
│       ├── agents/
│       ├── tools/
│       ├── prompts/
│       ├── policies/
│       └── tests/
├── packages/
│   ├── contracts/                 # schemas Zod, tipos e eventos
│   ├── game-rules/                # regras puras/testáveis
│   ├── map-format/                # parser e validador
│   ├── ui/                        # componentes compartilhados
│   └── config/                    # eslint, tsconfig, prettier
├── content/
│   └── frontier-1250/
│       ├── maps/
│       ├── tilesets/
│       ├── characters/
│       └── scenarios/
├── infra/
│   ├── docker/
│   ├── nginx/
│   ├── scripts/
│   └── compose.yaml
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── api/
│   ├── game-design/
│   └── runbooks/
├── tests/
│   ├── e2e/
│   └── load/
├── .github/workflows/
├── pnpm-workspace.yaml
├── package.json
├── .env.example
└── README.md
```

## 14. Entregas / roadmap

| Sprint | Foco | Entrega verificável |
|---|---|---|
| 0 — Fundação | pnpm, TypeScript, React, NestJS, containers, CI, lint, testes | `pnpm dev` sobe web/API/DB e healthcheck |
| 1 — Campanhas | auth, campanha, membros e roles | Mestre cria e convida usuário |
| 2 — Mapa renderizado | Pixi, câmera, sprites, chunks/tiles e importação Tiled JSON | vila renderiza com pan/zoom fluido |
| 3 — Editor básico | layers, pincel, objetos, colisão, drafts, publicação | Mestre edita/publica mapa e recarrega sem perder alterações |
| 4 — Multiplayer | rooms, tokens, comandos, presença, chat e reconexão | 3 navegadores sincronizados |
| 5 — Mundo persistente | portas/baús/itens, inventário, event log e snapshots | ações sobrevivem restart e concorrência |
| 6 — Painel Mestre | GM-only, NPC manual, eventos, relógio, dados | Mestre executa sessão completa |
| 7 — IA limitada | NPC diálogo, cronista e fila de aprovação | IA sugere e Mestre decide sobre estado do mundo |
| 8 — Estabilização | E2E, carga, permissões, backup/restore e deploy | beta fechado para uma campanha-piloto |

A duração de cada sprint depende da equipe e da disponibilidade de arte; não presumir horas/dias sem medir throughput. Evitar expandir para o mapa continental até validar 3 cenas completas.

### Primeiras issues recomendadas

1. Inicializar monorepo `pnpm` com `apps/web`, `apps/api`, `packages/contracts`.
2. Criar Compose para PostgreSQL, Redis e MinIO com volumes e healthchecks.
3. Definir esquemas `Campaign`, `Scene`, `TileChunk`, `WorldCommand`, `WorldEvent` em Zod.
4. Criar protótipo Pixi renderizando grade e tiles de uma vila.
5. Implementar câmera pan/zoom, seleção de token e colisão local para protótipo.
6. Criar camada de `WorldEngine` com autenticação e `token.move.request` autoritativo.
7. Criar transação idempotente de interação com baú e log de eventos.
8. Editor de chunks, rascunho/publicação e testes de isolamento de papéis.

## 15. Riscos de produto e mitigação

| Risco | Mitigação |
|---|---|
| Mundo aberto grande demais | prototipar 1 vila + 2 interiores e regiões em portas/portais |
| Arte histórica cara | tilesets licenciados adequadamente, atlas reutilizáveis, revisão histórica incremental |
| Editor e jogo alteram mapa ao mesmo tempo | versões publicadas imutáveis; rascunhos separados |
| Jogadores falsificam movimentação | servidor valida ACL, colisão e velocidade |
| Estados corrompidos por pedidos duplicados | `commandId` idempotente + transação e `revision` |
| IA expõe segredos ou muda narrativa sem controle | contexto por papel, propostas estruturadas e aprovação do Mestre |
| Crescimento prematuro de infraestrutura | monólito modular, deploy simples, métricas antes de escalar |

## 16. Fontes técnicas

- PixiJS v8 Architecture: https://pixijs.com/8.x/guides/concepts/architecture
- PixiJS Rendering: https://pixijs.com/8.x/guides/components/renderers
- NestJS WebSocket Gateways: https://docs.nestjs.com/websockets/gateways
- Socket.IO Rooms: https://socket.io/docs/v4/rooms/
- Socket.IO Redis Adapter: https://socket.io/docs/v4/redis-adapter
- Tiled JSON Map Format: https://doc.mapeditor.org/en/stable/reference/json-map-format/
- Tiled Infinite Maps: https://docs.mapeditor.org/en/stable/manual/using-infinite-maps/
- MapLibre GL JS (opcional futuro): https://maplibre.org/maplibre-gl-js/docs/
- Yjs Docs (opcional editor colaborativo futuro): https://docs.yjs.dev/

*Os exemplos de payload e o esboço SQL representam contratos propostos; precisam ser refinados e versionados na implementação.*