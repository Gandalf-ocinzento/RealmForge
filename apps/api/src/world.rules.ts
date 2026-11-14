import {
  MAP_HEIGHT, MAP_WIDTH, TERRAIN_TYPES,
  type Role, type Terrain, type WorldCommand, type WorldState
} from "@realmforge/contracts";

const index = (world: WorldState, x: number, y: number) => y * world.width + x;

export function initialWorld(): WorldState {
  const terrain: Terrain[] = Array.from({ length: MAP_WIDTH * MAP_HEIGHT }, (_, i) => {
    const x = i % MAP_WIDTH;
    const y = Math.floor(i / MAP_WIDTH);
    if (x >= 22) return "water";
    if (x === 10 || y === 9) return "road";
    if ((x + y * 3) % 17 === 0) return "dirt";
    return "grass";
  });
  for (let y = 3; y <= 6; y++) {
    for (let x = 3; x <= 7; x++) {
      if (x === 3 || x === 7 || y === 3 || y === 6) terrain[y * MAP_WIDTH + x] = "wall";
    }
  }
  // Porta na parede sul da casa, integrada ao sistema de colisão.
  terrain[6 * MAP_WIDTH + 5] = "road";
  for (let y = 2; y <= 5; y++) {
    for (let x = 15; x <= 19; x++) {
      if (x === 15 || x === 19 || y === 2 || y === 5) terrain[y * MAP_WIDTH + x] = "wall";
    }
  }
  return {
    revision: 0, width: MAP_WIDTH, height: MAP_HEIGHT, terrain,
    doors: [{ id: "porta-taverna", x: 5, y: 6, open: false }],
    players: {}
  };
}

export function validPoint(w: WorldState, x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) &&
    x >= 0 && x < w.width && y >= 0 && y < w.height;
}

export function walkable(w: WorldState, x: number, y: number): boolean {
  if (!validPoint(w, x, y)) return false;
  const tile = w.terrain[index(w, x, y)];
  if (tile === "wall" || tile === "water") return false;
  return !w.doors.some(d => d.x === x && d.y === y && !d.open);
}

export function upsertPlayer(world: WorldState, playerId: string, name: string): WorldState {
  const next = structuredClone(world);
  if (!next.players[playerId]) {
    const colors = [0xeec36c, 0x84bfe1, 0xe69075, 0x9bcd85, 0xc9a3e3];
    const color = colors[Object.keys(next.players).length % colors.length];
    next.players[playerId] = { id: playerId, name, color, x: 10, y: 10 };
  } else {
    next.players[playerId].name = name;
  }
  next.revision++;
  return next;
}

export function applyCommand(
  world: WorldState, playerId: string, role: Role, command: WorldCommand
): WorldState {
  if (!command || typeof command !== "object" || typeof command.type !== "string") {
    throw new Error("Comando inválido.");
  }
  const player = world.players[playerId];
  if (!player) throw new Error("Personagem não encontrado.");
  const next = structuredClone(world);

  if (command.type === "player.move") {
    if (!validPoint(world, command.x, command.y)) throw new Error("Destino inválido.");
    const steps = Math.abs(player.x - command.x) + Math.abs(player.y - command.y);
    if (steps !== 1) throw new Error("Movimente apenas uma casa por vez.");
    if (!walkable(world, command.x, command.y)) throw new Error("Caminho bloqueado.");
    next.players[playerId].x = command.x;
    next.players[playerId].y = command.y;
  } else if (command.type === "map.paint") {
    if (role !== "mestre") throw new Error("Apenas o Mestre pode editar o mapa.");
    if (!validPoint(world, command.x, command.y)) throw new Error("Coordenada inválida.");
    if (!TERRAIN_TYPES.includes(command.terrain)) throw new Error("Terreno inválido.");
    if (world.doors.some(d => d.x === command.x && d.y === command.y)) {
      throw new Error("Não é possível pintar sobre uma porta.");
    }
    next.terrain[index(next, command.x, command.y)] = command.terrain;
  } else if (command.type === "door.toggle") {
    const door = next.doors.find(d => d.id === command.doorId);
    if (!door) throw new Error("Porta inexistente.");
    if (role !== "mestre" && Math.abs(door.x - player.x) + Math.abs(door.y - player.y) > 1) {
      throw new Error("Aproxime-se da porta.");
    }
    door.open = !door.open;
  } else {
    throw new Error("Comando não reconhecido.");
  }
  next.revision++;
  return next;
}
