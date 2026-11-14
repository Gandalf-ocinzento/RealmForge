import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCommand, initialWorld, upsertPlayer } from "./world.rules";

test("personagem só atravessa caminhos livres e adjacentes", () => {
  const world = upsertPlayer(initialWorld(), "id1", "Viajante");
  const moved = applyCommand(world, "id1", "jogador", { type: "player.move", x: 11, y: 10 });
  assert.equal(moved.players.id1.x, 11);
  assert.throws(() => applyCommand(world, "id1", "jogador", { type: "player.move", x: 19, y: 12 }));
  assert.equal(applyCommand(world, "id1", "jogador", { type: "player.move", x: 10, y: 9 }).players.id1.y, 9);
});

test("jogador não pode editar terrenos do mundo", () => {
  const world = upsertPlayer(initialWorld(), "id1", "Viajante");
  assert.throws(() => applyCommand(world, "id1", "jogador", {
    type: "map.paint", x: 4, y: 4, terrain: "road"
  }), /Mestre/);
});

test("Mestre pode editar e alterações incrementam a revisão", () => {
  const world = upsertPlayer(initialWorld(), "id1", "Mestre");
  const next = applyCommand(world, "id1", "mestre", {
    type: "map.paint", x: 4, y: 4, terrain: "road"
  });
  assert.equal(next.terrain[4 * next.width + 4], "road");
  assert.equal(next.revision, world.revision + 1);
});

test("porta começa fechada e pode ser aberta", () => {
  const world = upsertPlayer(initialWorld(), "id1", "Mestre");
  assert.equal(world.doors[0].open, false);
  const next = applyCommand(world, "id1", "mestre", {
    type: "door.toggle", doorId: "porta-taverna"
  });
  assert.equal(next.doors[0].open, true);
});
