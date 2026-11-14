import {
  Inject, Logger,
} from "@nestjs/common";
import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect
} from "@nestjs/websockets";
import { randomUUID } from "node:crypto";
import type { Socket, Server } from "socket.io";
import type { ActionResult, Role, WorldCommand } from "@realmforge/contracts";
import { WorldRepository } from "./world.repository";
import { applyCommand, upsertPlayer } from "./world.rules";

interface Session {
  roomId: string;
  playerId: string;
  role: Role;
  name: string;
}

@WebSocketGateway({ cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly log = new Logger(GameGateway.name);
  private readonly sessions = new Map<string, Session>();

  constructor(@Inject(WorldRepository) private readonly worlds: WorldRepository) {}

  async handleConnection(socket: Socket): Promise<void> {
    const { playerId, name, role } = socket.handshake.auth as Record<string, unknown>;
    if (
      typeof playerId !== "string" || !/^[a-zA-Z0-9_-]{8,80}$/.test(playerId) ||
      typeof name !== "string" || name.trim().length < 2 || name.trim().length > 32 ||
      (role !== "mestre" && role !== "jogador")
    ) {
      socket.emit("world:error", "Dados de entrada inválidos.");
      socket.disconnect(true);
      return;
    }
    const session: Session = { playerId, name: name.trim(), role: role as Role, roomId: "demo" };
    try {
      const world = await this.worlds.mutate("demo", current =>
        upsertPlayer(current, session.playerId, session.name)
      );
      this.sessions.set(socket.id, session);
      await socket.join(session.roomId);
      this.server.to(session.roomId).emit("world:state", world);
      this.log.log("Entrou: " + session.name);
    } catch (err) {
      this.log.error("Falha de conexão: " + String(err));
      socket.emit("world:error", "Não foi possível carregar o mundo.");
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    this.sessions.delete(socket.id);
  }

  @SubscribeMessage("world:command")
  async onCommand(
    @ConnectedSocket() socket: Socket,
    @MessageBody() command: WorldCommand
  ): Promise<ActionResult> {
    const session = this.sessions.get(socket.id);
    if (!session) return { ok: false, error: "Sessão inválida." };
    try {
      const next = await this.worlds.mutate(session.roomId, w =>
        applyCommand(w, session.playerId, session.role, command)
      );
      this.server.to(session.roomId).emit("world:state", next);
      return { ok: true, revision: next.revision };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido." };
    }
  }

  @SubscribeMessage("chat:send")
  onChat(@ConnectedSocket() socket: Socket, @MessageBody() text: unknown): ActionResult {
    const session = this.sessions.get(socket.id);
    if (!session) return { ok: false, error: "Sessão inválida." };
    if (typeof text !== "string" || !text.trim() || text.length > 300) {
      return { ok: false, error: "Mensagem inválida (máximo 300 caracteres)." };
    }
    this.server.to(session.roomId).emit("chat:message", {
      id: randomUUID(), name: session.name, text: text.trim(), time: new Date().toISOString()
    });
    return { ok: true };
  }
}
