export * from "./world-atlas";

export const MAP_WIDTH = 36;
export const MAP_HEIGHT = 24;
export const TILE_SIZE = 32;
export const TERRAIN_TYPES = [
  "grass", "road", "dirt", "water", "wall", "forest", "tree",
  "stone", "snow", "floor", "marsh", "bridge", "mountain"
] as const;
export type Terrain = (typeof TERRAIN_TYPES)[number];
export type Role = "mestre" | "jogador";
export interface GridPoint { x: number; y: number; }
export interface PlayerState extends GridPoint { id: string; name: string; color: number; }
export interface DoorState extends GridPoint { id: string; open: boolean; }
export interface WorldState {
  sceneId: string;
  revision: number;
  width: number;
  height: number;
  terrain: Terrain[];
  doors: DoorState[];
  players: Record<string,PlayerState>;
}
export type WorldCommand =
  | ({ type:"player.move" } & GridPoint)
  | ({ type:"map.paint"; terrain: Terrain } & GridPoint)
  | { type:"door.toggle"; doorId:string };
export interface ActionResult { ok:boolean; revision?:number; error?:string; sceneId?:string; }
export interface ChatMessage { id:string; name:string; text:string; time:string; }
