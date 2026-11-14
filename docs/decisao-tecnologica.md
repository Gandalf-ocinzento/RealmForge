# RealmForge — Decisão de linguagens e arquitetura (ADR-001)

**Data:** 2026-11-14  
**Status:** Aceita para a primeira versão experimental

## Decisão

- **TypeScript:** navegador, editor de mapas, contratos e backend (React + PixiJS 8 + NestJS + Socket.IO).
- **SQL/PostgreSQL:** fonte de verdade para o estado do mundo. Atualizações críticas são transacionais.
- **Python:** linguagem planejada para workers de IA, ainda não implementados.
- **Go e Rust:** alternativas para serviços especializados, somente se benchmarks justificarem.

## Por quê

1. Uma única linguagem tipada para cliente, servidor e contratos diminui atrito de desenvolvimento.
2. PixiJS permite renderização 2D diretamente no navegador e integração com interface React.
3. Socket.IO oferece eventos tipados e salas multiplayer, e NestJS estrutura a API.
4. Python tem ecossistema consolidado para modelos, agentes e processamento textual.
5. Introduzir microserviços Go/Rust agora aumentaria o custo sem evidência de gargalo.

## Alternativas avaliadas

| Alternativa | Pontos fortes | Razão para não adotar agora |
|---|---|---|
| TypeScript | Browser nativo, bibliotecas 2D, contratos comuns | Adotado |
| Python | IA, processamento e automação | Usar como serviço secundário |
| Go | Concorrência e eficiência de servidor | Desnecessário antes de testes de carga |
| Rust | Desempenho e segurança de memória | Complexidade adicional no MVP |
| C# / Unity | Ecossistema de jogos | Ferramentas web e editor integrado exigiriam mais integração |
| Godot / GDScript | Engine 2D pronta | Preferência por integração direta com DOM/React |

## Fontes consultadas

- PixiJS v8 — https://pixijs.com/8.x/guides/components/application
- Socket.IO TypeScript — https://socket.io/docs/v4/typescript/
- NestJS Gateways — https://docs.nestjs.com/websockets/gateways
- Godot Web Export — https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- Stack Overflow Developer Survey 2026 — https://survey.stackoverflow.co/2026/technology/data/languages
- Python para agentes (OpenAI) — https://openai.github.io/openai-agents-python/

## Limitações da etapa inicial

O protótipo funciona como **ambiente local de desenvolvimento**. O papel de Mestre é escolhido pelo visitante e ainda não é autenticado. Não disponibilizar esta versão publicamente. Autenticação, autorização por campanha, logs permanentes de eventos, rate limits e proteção contra abuso são requisitos para qualquer beta externo.

O tema de *A Sociedade do Anel* é usado como pesquisa e roteiro de uma potencial adaptação. A publicação de personagens, mapas e elementos protegidos depende da avaliação de direitos e licenças.
