import { Inject, Logger } from "@nestjs/common";
import {
  ConnectedSocket,MessageBody,SubscribeMessage,WebSocketGateway,WebSocketServer,
  OnGatewayConnection,OnGatewayDisconnect
} from "@nestjs/websockets";
import {randomUUID} from "node:crypto";
import type {Socket,Server} from "socket.io";
import {
  canTravel,SCENE_ORDER,SCENES,type ActionResult,type Role,type WorldCommand
} from "@realmforge/contracts";
import {WorldRepository} from "./world.repository";
import {applyCommand,upsertPlayer} from "./world.rules";

interface Session{sceneId:string;playerId:string;name:string;role:Role;}
const room=(sceneId:string)=>"demo:"+sceneId;
@WebSocketGateway({cors:{origin:process.env.WEB_ORIGIN??"http://localhost:5173"}})
export class GameGateway implements OnGatewayConnection,OnGatewayDisconnect{
  @WebSocketServer() server!:Server;
  private readonly log=new Logger(GameGateway.name);
  private readonly sessions=new Map<string,Session>();
  constructor(@Inject(WorldRepository)private readonly worlds:WorldRepository){}

  async handleConnection(socket:Socket):Promise<void>{
    const {playerId,name,role}=socket.handshake.auth as Record<string,unknown>;
    if(typeof playerId!=="string"||!/^[a-zA-Z0-9_-]{8,80}$/.test(playerId)||
       typeof name!=="string"||name.trim().length<2||name.trim().length>32||
       (role!=="mestre"&&role!=="jogador")){
      socket.emit("world:error","Entrada inválida."); socket.disconnect(true);return;
    }
    try{
      const sceneId=await this.worlds.location(playerId);
      const session:Session={playerId,name:name.trim(),role,sceneId};
      const world=await this.worlds.mutate(sceneId,w=>upsertPlayer(w,playerId,session.name));
      this.sessions.set(socket.id,session);
      await socket.join(room(sceneId));
      socket.emit("world:scene",{sceneId});
      this.server.to(room(sceneId)).emit("world:state",world);
    }catch(e){
      this.log.error(String(e));socket.emit("world:error","Não foi possível entrar no mundo.");
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket:Socket):void{this.sessions.delete(socket.id);}

  @SubscribeMessage("world:command")
  async command(@ConnectedSocket() socket:Socket,@MessageBody() action:WorldCommand):Promise<ActionResult>{
    const s=this.sessions.get(socket.id);
    if(!s)return{ok:false,error:"Sessão inválida."};
    try{
      const world=await this.worlds.mutate(s.sceneId,w=>applyCommand(w,s.playerId,s.role,action));
      this.server.to(room(s.sceneId)).emit("world:state",world);
      return{ok:true,revision:world.revision,sceneId:s.sceneId};
    }catch(e){return{ok:false,error:e instanceof Error?e.message:"Erro inválido."};}
  }

  @SubscribeMessage("world:travel")
  async travel(@ConnectedSocket()socket:Socket,@MessageBody()input:unknown):Promise<ActionResult>{
    const s=this.sessions.get(socket.id);
    if(!s)return{ok:false,error:"Sessão inválida."};
    const dest=(input&&typeof input==="object"&&"sceneId" in input)?input.sceneId:undefined;
    if(typeof dest!=="string"||!canTravel(s.sceneId,dest)){
      return{ok:false,error:"O destino deve ser a próxima região ou a anterior."};
    }
    try{
      const old=await this.worlds.get(s.sceneId);
      const player=old.players[s.playerId];
      if(!player)throw new Error("Seu personagem não está nesta cena.");
      const movingForward=SCENE_ORDER.indexOf(dest)>SCENE_ORDER.indexOf(s.sceneId);
      const atExit=movingForward?player.x>=old.width-4:player.x<=3;
      if(s.role!=="mestre"&&!atExit){
        throw new Error("Caminhe até a borda da estrada para viajar.");
      }
      const from=s.sceneId;
      const arrival=movingForward?"west":"east";
      const result=await this.worlds.transfer(s.playerId,s.name,from,dest,arrival,
        w=>upsertPlayer(w,s.playerId,s.name,arrival)
      );
      await socket.leave(room(from));
      s.sceneId=dest;
      await socket.join(room(dest));
      socket.emit("world:scene",{sceneId:dest});
      this.server.to(room(from)).emit("world:state",result.previous);
      this.server.to(room(dest)).emit("world:state",result.current);
      return{ok:true,revision:result.current.revision,sceneId:dest};
    }catch(e){return{ok:false,error:e instanceof Error?e.message:"Falha ao viajar."};}
  }

  @SubscribeMessage("chat:send")
  chat(@ConnectedSocket()socket:Socket,@MessageBody()message:unknown):ActionResult{
    const s=this.sessions.get(socket.id);
    if(!s)return{ok:false,error:"Sessão inválida."};
    if(typeof message!=="string"||!message.trim()||message.length>300){
      return{ok:false,error:"Mensagem inválida (máximo 300 caracteres)."};
    }
    this.server.to(room(s.sceneId)).emit("chat:message",{
      id:randomUUID(),name:s.name,text:message.trim(),time:new Date().toISOString()
    });
    return{ok:true};
  }
}
