import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";
import {
  TILE_SIZE, type Terrain, type WorldState, type WorldCommand,
} from "@realmforge/contracts";

interface Props {
  world: WorldState;
  playerId: string;
  isMaster: boolean;
  tool: "move" | Terrain;
  onCommand: (command: WorldCommand) => void;
  zoom: number;
}

const palette: Record<Terrain, number> = {
  grass: 0x345743,
  road: 0x9b8a67,
  dirt: 0x6d6048,
  water: 0x386984,
  wall: 0x596259
};

function tile(world: WorldState, x: number, y: number): Terrain {
  return world.terrain[y * world.width + x];
}

function drawWorld(
  stage: Container, world: WorldState, playerId: string,
  isMaster: boolean, tool: Props["tool"], onCommand: Props["onCommand"],
): void {
  for (const item of stage.removeChildren()) item.destroy({ children: true });
  const tileSize = TILE_SIZE;
  const local = world.players[playerId];

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const kind = tile(world, x, y);
      const cell = new Graphics();
      cell.rect(x * tileSize, y * tileSize, tileSize, tileSize)
        .fill(palette[kind]);
      cell.rect(x * tileSize, y * tileSize, tileSize, tileSize)
        .stroke({ color: 0x101c17, width: 0.75, alpha: 0.42 });
      if ((x * 7 + y * 11) % 9 === 0 && kind === "grass") {
        cell.circle(x * tileSize + 7, y * tileSize + 12, 2).fill({ color: 0x83a782, alpha: 0.6 });
        cell.circle(x * tileSize + 26, y * tileSize + 25, 1.5).fill({ color: 0xb2c190, alpha: 0.5 });
      }
      cell.eventMode = "static";
      cell.cursor = "pointer";
      cell.on("pointertap", () => {
        if (isMaster && tool !== "move") {
          onCommand({ type: "map.paint", x, y, terrain: tool });
          return;
        }
        if (!local) return;
        if (Math.abs(local.x - x) + Math.abs(local.y - y) === 1) {
          onCommand({ type: "player.move", x, y });
        }
      });
      stage.addChild(cell);
    }
  }

  for (const door of world.doors) {
    const item = new Graphics();
    const x = door.x * tileSize;
    const y = door.y * tileSize;
    item.roundRect(x + 5, y + 5, tileSize - 10, tileSize - 10, 3)
      .fill(door.open ? 0x6d9c72 : 0xc79a51)
      .stroke({ width: 2, color: 0x1c2a20 });
    item.eventMode = "static";
    item.cursor = "pointer";
    item.on("pointertap", () => onCommand({ type: "door.toggle", doorId: door.id }));
    stage.addChild(item);
  }
  for (const player of Object.values(world.players)) {
    const px = player.x * tileSize + tileSize / 2;
    const py = player.y * tileSize + tileSize / 2;
    const marker = new Graphics();
    marker.circle(px, py, player.id === playerId ? 13 : 11)
      .fill(player.color)
      .stroke({ width: player.id === playerId ? 3 : 2, color: 0x112119 });
    marker.eventMode = "none";
    stage.addChild(marker);

    const initials = new Text({
      text: player.name.slice(0, 1).toUpperCase(),
      style: { fontFamily: "Arial", fontSize: 12, fontWeight: "bold", fill: 0x122016 }
    });
    initials.anchor.set(0.5);
    initials.position.set(px, py);
    initials.eventMode = "none";
    stage.addChild(initials);
  }
}

export function MapCanvas({ world, playerId, isMaster, tool, onCommand, zoom }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Application | null>(null);
  const stage = useRef<Container | null>(null);
  const previous = useRef({ world, playerId, isMaster, tool, onCommand, zoom });
  previous.current = { world, playerId, isMaster, tool, onCommand, zoom };

  useEffect(() => {
    let active = true;
    const app = new Application();
    (async () => {
      await app.init({
        width: world.width * TILE_SIZE,
        height: world.height * TILE_SIZE,
        background: "#14241c", antialias: true
      });
      if (!active || !host.current) {
        app.destroy(true);
        return;
      }
      const layer = new Container();
      app.stage.addChild(layer);
      game.current = app;
      stage.current = layer;
      host.current.appendChild(app.canvas);
      const p = previous.current;
      drawWorld(layer, p.world, p.playerId, p.isMaster, p.tool, p.onCommand);
      app.canvas.style.width = (p.world.width * TILE_SIZE * p.zoom) + "px";
      app.canvas.style.height = (p.world.height * TILE_SIZE * p.zoom) + "px";
    })().catch(err => console.error("Falha ao inicializar mapa:", err));
    return () => {
      active = false;
      stage.current = null;
      game.current = null;
      app.destroy(true, { children: true });
    };
    // Inicializar o renderer somente uma vez por montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stage.current || !game.current) return;
    drawWorld(stage.current, world, playerId, isMaster, tool, onCommand);
    game.current.canvas.style.width = (world.width * TILE_SIZE * zoom) + "px";
    game.current.canvas.style.height = (world.height * TILE_SIZE * zoom) + "px";
  }, [world, playerId, isMaster, tool, onCommand, zoom]);
  return <div className="map-scroll" aria-label="Mapa interativo da vila">
    <div ref={host} className="map-host" />
  </div>;
}
