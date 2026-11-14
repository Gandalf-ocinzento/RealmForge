import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool, type PoolClient } from "pg";
import type { WorldState } from "@realmforge/contracts";
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
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private async ensureRoom(client: PoolClient, roomId: string): Promise<void> {
    await client.query(
      "INSERT INTO world_snapshots (room_id, state) VALUES ($1, $2::jsonb) " +
      "ON CONFLICT (room_id) DO NOTHING",
      [roomId, JSON.stringify(initialWorld())]
    );
  }

  async get(roomId: string): Promise<WorldState> {
    const client = await this.pool.connect();
    try {
      await this.ensureRoom(client, roomId);
      const result = await client.query<{ state: WorldState }>(
        "SELECT state FROM world_snapshots WHERE room_id = $1", [roomId]
      );
      return result.rows[0].state;
    } finally {
      client.release();
    }
  }

  // A transação serializa mudanças concorrentes no mesmo mundo.
  async mutate(roomId: string, transform: (current: WorldState) => WorldState): Promise<WorldState> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await this.ensureRoom(client, roomId);
      const result = await client.query<{ state: WorldState }>(
        "SELECT state FROM world_snapshots WHERE room_id = $1 FOR UPDATE", [roomId]
      );
      const next = transform(result.rows[0].state);
      await client.query(
        "UPDATE world_snapshots SET state = $2::jsonb, updated_at = NOW() WHERE room_id = $1",
        [roomId, JSON.stringify(next)]
      );
      await client.query("COMMIT");
      return next;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
