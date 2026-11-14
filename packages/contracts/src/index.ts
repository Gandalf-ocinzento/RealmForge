export const MAP_WIDTH = 24;
export const MAP_HEIGHT = 16;
export const TILE_SIZE = 36;

export const TERRAIN_TYPES = ["grass", "road", "dirt", "water", "wall"] as const;
export type Terrain = (typeof TERRAIN_TYPES)[number];
export type Role = "mestre" | "jogador";

export interface GridPoint {
  x: number;
  y: number;
}
export interface PlayerState extends GridPoint {
  id: string;
  name: string;
  color: number;
}
export interface DoorState extends GridPoint {
  id: string;
  open: boolean;
}
export interface WorldState {
  revision: number;
  width: number;
  height: number;
  terrain: Terrain[];
  doors: DoorState[];
  players: Record<string, PlayerState>;
}
export type WorldCommand =
  | ({ type: "player.move" } & GridPoint)
  | ({ type: "map.paint"; terrain: Terrain } & GridPoint)
  | { type: "door.toggle"; doorId: string };

export interface ActionResult {
  ok: boolean;
  revision?: number;
  error?: string;
}
export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  time: string;
}
