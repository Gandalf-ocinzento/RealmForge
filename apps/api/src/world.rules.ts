import {
  TERRAIN_TYPES, type Role, type WorldCommand, type WorldState
} from "@realmforge/contracts";
import { buildScene, spawnPoint } from "./scenes";

export const initialWorld=buildScene;
const idx=(w:WorldState,x:number,y:number)=>y*w.width+x;

export function validPoint(w:WorldState,x:number,y:number):boolean {
  return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<w.width&&y>=0&&y<w.height;
}
export function walkable(w:WorldState,x:number,y:number):boolean {
  if(!validPoint(w,x,y))return false;
  if(["wall","water","tree","mountain"].includes(w.terrain[idx(w,x,y)]))return false;
  return !w.doors.some(d=>d.x===x&&d.y===y&&!d.open);
}
export function upsertPlayer(
  world:WorldState,id:string,name:string,arrival:"west"|"east"="west"
):WorldState {
  const next=structuredClone(world);
  if(!next.players[id]){
    const colors=[0xeec36c,0x84bfe1,0xe69075,0x9bcd85,0xc9a3e3];
    const pt=spawnPoint(world.sceneId,arrival);
    next.players[id]={id,name,color:colors[Object.keys(next.players).length%colors.length],...pt};
  }else next.players[id].name=name;
  next.revision++;
  return next;
}
export function applyCommand(
  world:WorldState,playerId:string,role:Role,command:WorldCommand
):WorldState {
  if(!command||typeof command!=="object"||typeof command.type!=="string"){
    throw new Error("Comando inválido.");
  }
  const player=world.players[playerId];
  if(!player)throw new Error("Personagem não encontrado.");
  const next=structuredClone(world);
  switch(command.type){
    case "player.move": {
      if(!validPoint(world,command.x,command.y))throw new Error("Destino inválido.");
      const steps=Math.abs(player.x-command.x)+Math.abs(player.y-command.y);
      if(steps!==1)throw new Error("Movimente apenas uma casa por vez.");
      if(!walkable(world,command.x,command.y))throw new Error("Caminho bloqueado.");
      // Não permitir tokens em cima de outros jogadores no mesmo local.
      if(Object.values(world.players).some(p=>p.id!==playerId&&p.x===command.x&&p.y===command.y)){
        throw new Error("Casa ocupada.");
      }
      next.players[playerId].x=command.x;
      next.players[playerId].y=command.y;
      break;
    }
    case "map.paint":
      if(role!=="mestre")throw new Error("Apenas o Mestre pode editar o mapa.");
      if(!validPoint(world,command.x,command.y))throw new Error("Coordenada inválida.");
      if(!TERRAIN_TYPES.includes(command.terrain))throw new Error("Terreno inválido.");
      if(world.doors.some(d=>d.x===command.x&&d.y===command.y)){
        throw new Error("Não é possível pintar sobre uma porta.");
      }
      next.terrain[idx(next,command.x,command.y)]=command.terrain;
      break;
    case "door.toggle": {
      const door=next.doors.find(d=>d.id===command.doorId);
      if(!door)throw new Error("Porta inexistente.");
      const distance=Math.abs(door.x-player.x)+Math.abs(door.y-player.y);
      if(role!=="mestre"&&distance>1)throw new Error("Aproxime-se da porta.");
      door.open=!door.open;
      break;
    }
    default: throw new Error("Comando desconhecido.");
  }
  next.revision++;
  return next;
}
