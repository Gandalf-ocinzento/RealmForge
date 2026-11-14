import assert from "node:assert/strict";
import { test } from "node:test";
import {SCENES,canTravel} from "@realmforge/contracts";
import {applyCommand, initialWorld,upsertPlayer,walkable} from "./world.rules";
import { spawnPoint,trailY } from "./scenes";

test("todos os mapas têm dimensões, terrenos e passagens jogáveis",()=>{
  for(const s of SCENES){
    const world=initialWorld(s.id);
    assert.equal(world.sceneId,s.id);
    assert.equal(world.terrain.length,world.width*world.height);
    assert.equal(walkable(world,2,trailY(2,s.seed)),true);
    assert.equal(walkable(world,world.width-3,trailY(world.width-3,s.seed)),true);
  }
});
test("a rota só permite viajar entre mapas vizinhos",()=>{
  assert.equal(canTravel("hobbiton","woody-end"),true);
  assert.equal(canTravel("hobbiton","moria"),false);
});
test("movimento é validado e a pintura exige Mestre",()=>{
  const w=upsertPlayer(initialWorld("hobbiton"),"player1","Hobbit");
  const p=w.players.player1;
  assert.deepEqual({x:p.x,y:p.y},spawnPoint("hobbiton"));
  assert.throws(()=>applyCommand(w,"player1","jogador",{type:"player.move",x:p.x+9,y:p.y}),/uma casa/);
  assert.throws(()=>applyCommand(w,"player1","jogador",{type:"map.paint",x:3,y:3,terrain:"road"}),/Mestre/);
  const next=applyCommand(w,"player1","mestre",{type:"map.paint",x:3,y:3,terrain:"road"});
  assert.equal(next.terrain[3*next.width+3],"road");
});
test("portas começam fechadas e podem ser abertas pelo Mestre",()=>{
  const w=upsertPlayer(initialWorld("moria"),"player1","Mestre");
  assert.equal(w.doors.length,1);
  assert.equal(w.doors[0].open,false);
  const next=applyCommand(w,"player1","mestre",{type:"door.toggle",doorId:w.doors[0].id});
  assert.equal(next.doors[0].open,true);
});
