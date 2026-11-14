import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool, type PoolClient } from "pg";
import {DEFAULT_SCENE_ID, sceneById, type WorldState} from "@realmforge/contracts";
import { initialWorld } from "./world.rules";

@Injectable()
export class WorldRepository implements OnModuleInit, OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL ??
      "postgresql://realmforge:realmforge_dev@localhost:5432/realmforge"
  });

  async onModuleInit(): Promise<void> {
    await this.pool.query(
      "CREATE TABLE IF NOT EXISTS world_snapshots (" +
      "room_id TEXT PRIMARY KEY, state JSONB NOT NULL, " +
      "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
    );
    await this.pool.query(
      "CREATE TABLE IF NOT EXISTS player_locations (" +
      "player_id TEXT PRIMARY KEY, scene_id TEXT NOT NULL, " +
      "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
    );
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }

  private sceneRoom(sceneId:string):string {
    if (!sceneById(sceneId)) throw new Error("Cena inexistente.");
    return "demo:" + sceneId;
  }

  private async ensureRoom(client:PoolClient, sceneId:string):Promise<string>{
    const roomId = this.sceneRoom(sceneId);
    await client.query(
      "INSERT INTO world_snapshots(room_id,state) VALUES($1,$2::jsonb) ON CONFLICT(room_id) DO NOTHING",
      [roomId,JSON.stringify(initialWorld(sceneId))]
    );
    return roomId;
  }

  async get(sceneId:string):Promise<WorldState>{
    const client=await this.pool.connect();
    try {
      const room=await this.ensureRoom(client,sceneId);
      const result=await client.query<{state:WorldState}>(
        "SELECT state FROM world_snapshots WHERE room_id=$1",[room]
      );
      return result.rows[0].state;
    } finally {client.release();}
  }

  async location(playerId:string):Promise<string>{
    const r=await this.pool.query<{scene_id:string}>(
      "SELECT scene_id FROM player_locations WHERE player_id=$1",[playerId]
    );
    return sceneById(r.rows[0]?.scene_id)? r.rows[0].scene_id:DEFAULT_SCENE_ID;
  }

  async mutate(sceneId:string,transform:(world:WorldState)=>WorldState):Promise<WorldState>{
    const client=await this.pool.connect();
    try {
      await client.query("BEGIN");
      const room=await this.ensureRoom(client,sceneId);
      const r=await client.query<{state:WorldState}>(
        "SELECT state FROM world_snapshots WHERE room_id=$1 FOR UPDATE",[room]
      );
      const next=transform(r.rows[0].state);
      if(next.sceneId!==sceneId) throw new Error("Identidade de cena inconsistente.");
      await client.query(
        "UPDATE world_snapshots SET state=$2::jsonb,updated_at=NOW() WHERE room_id=$1",
        [room,JSON.stringify(next)]
      );
      await client.query("COMMIT");
      return next;
    } catch(e){await client.query("ROLLBACK");throw e;} finally{client.release();}
  }

  // Retira o personagem da cena anterior, insere na nova e atualiza seu local
  // numa única transação (evita perda de localização entre desconexões).
  async transfer(
    playerId:string,name:string,from:string,to:string,
    arrival:"west"|"east",
    enter:(world:WorldState)=>WorldState
  ):Promise<{previous:WorldState;current:WorldState}>{
    this.sceneRoom(from);this.sceneRoom(to);
    const client=await this.pool.connect();
    try {
      await client.query("BEGIN");
      const rooms=[from,to].sort();
      for(const id of rooms) await this.ensureRoom(client,id);
      const locked=new Map<string,WorldState>();
      for(const id of rooms){
        const r=await client.query<{state:WorldState}>(
          "SELECT state FROM world_snapshots WHERE room_id=$1 FOR UPDATE",[this.sceneRoom(id)]
        );
        locked.set(id,r.rows[0].state);
      }
      const prev=structuredClone(locked.get(from)!);
      if(!prev.players[playerId]) throw new Error("Jogador não encontrado na cena.");
      delete prev.players[playerId]; prev.revision++;
      const next=enter(locked.get(to)!);
      if(!next.players[playerId]) throw new Error("Transferência não inseriu jogador.");
      for(const [id,w] of [[from,prev],[to,next]] as const){
        await client.query(
          "UPDATE world_snapshots SET state=$2::jsonb,updated_at=NOW() WHERE room_id=$1",
          [this.sceneRoom(id),JSON.stringify(w)]
        );
      }
      await client.query(
        "INSERT INTO player_locations(player_id,scene_id) VALUES($1,$2) "+
        "ON CONFLICT(player_id) DO UPDATE SET scene_id=EXCLUDED.scene_id,updated_at=NOW()",
        [playerId,to]
      );
      await client.query("COMMIT");
      return {previous:prev,current:next};
    } catch(e){await client.query("ROLLBACK");throw e;} finally{client.release();}
  }
}
