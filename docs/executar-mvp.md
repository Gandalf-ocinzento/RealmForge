# Executar o protótipo RealmForge

## Pré-requisitos

- Node.js 22 LTS ou mais recente compatível.
- npm 10+.
- Docker e Docker Compose.
- Portas locais 5173 (web), 3001 (API) e 5432 (PostgreSQL) disponíveis.

## Primeira execução

```bash
git clone https://github.com/Gandalf-ocinzento/RealmForge.git
cd RealmForge
cp .env.example .env
npm install
docker compose up -d
npm run dev
```

Acesse http://localhost:5173 em dois navegadores/abas. Entre com nomes diferentes e controle personagens por clique ou WASD/setas após focar a área do mapa. Em uma aba, selecione **Mestre (demo)** para experimentar o editor de terrenos. Clique na porta dourada para abrir ou fechar. O mundo deve persistir mesmo após reiniciar a API, desde que o volume PostgreSQL seja mantido.

## Ferramentas

- Mover: deslocamento de uma casa ortogonal de cada vez.
- Mestre: escolha grama, terra, água, estrada ou parede e clique para pintar.
- Porta: clique no objeto dourado (verde quando aberto).
- Chat: mensagens transitórias da sala, sem armazenamento.
- Zoom: botões + e − acima do mapa.

## Comandos úteis

```bash
npm run build
npm run typecheck
npm test
docker compose logs -f db
docker compose down
```

## Avisos importantes

- **Versão apenas para desenvolvimento local.** O Mestre é escolhido livremente na tela de entrada; não há autenticação, controle de acesso nem proteção contra abuso. Não implante em um servidor aberto.
- Uma única sala `demo` é usada por todos os visitantes; identidade armazenada no `sessionStorage` não é prova de identidade.
- O mundo usa um único snapshot JSONB transacional por sala. O log de eventos e a persistência detalhada serão implementados numa etapa seguinte.
- O mapa inicial é uma vila genérica procedimental original, **não** um mapa licenciado da Terra-média.
- O editor atual é pintura de terrenos em grade; camadas, desfazer, importação e publicações de versões são etapas futuras.
- A interface importa Google Fonts, mas funciona com fontes locais de fallback quando offline.
- Os scripts foram gerados e não foram validados por `npm install`/build nesta sessão; execute os comandos acima e reporte qualquer incompatibilidade para correção.
