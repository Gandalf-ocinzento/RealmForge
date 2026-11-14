import {useCallback,useEffect,useRef,useState} from "react";
import {io,type Socket} from "socket.io-client";
import {
  SCENES,SCENE_NEXT,sceneById,
  type Role,type Terrain,type WorldCommand,type WorldState,
  type ChatMessage,type ActionResult
} from "@realmforge/contracts";
import {MapCanvas} from "./MapCanvas";
import {JourneyAtlas} from "./JourneyAtlas";

const API_URL=import.meta.env.VITE_API_URL??"http://localhost:3001";
const BRUSHES:Array<{id:Terrain;label:string;icon:string}>=[
 {id:"grass",label:"Grama",icon:"🌱"},{id:"road",label:"Estrada",icon:"🛤"},
 {id:"dirt",label:"Terra",icon:"🟤"},{id:"water",label:"Água",icon:"💧"},
 {id:"wall",label:"Parede",icon:"🧱"},{id:"forest",label:"Bosque",icon:"🌲"},
 {id:"tree",label:"Árvore",icon:"🌳"},{id:"stone",label:"Pedra",icon:"🪨"},
 {id:"snow",label:"Neve",icon:"❄️"},{id:"floor",label:"Piso",icon:"▦"},
 {id:"marsh",label:"Pântano",icon:"🌫️"},{id:"bridge",label:"Ponte",icon:"🌉"},
 {id:"mountain",label:"Montanha",icon:"⛰️"}
];
const persistentId=()=>{
 const old=sessionStorage.getItem("realmforge-player-id");
 if(old)return old;
 const id="p_"+crypto.randomUUID().replaceAll("-","");
 sessionStorage.setItem("realmforge-player-id",id);return id;
};
export function App(){
 const [name,setName]=useState(()=>sessionStorage.getItem("realmforge-name")??"");
 const [role,setRole]=useState<Role>("jogador");
 const [joined,setJoined]=useState(false);
 const [status,setStatus]=useState("Desconectado");
 const [world,setWorld]=useState<WorldState|null>(null);
 const [messages,setMessages]=useState<ChatMessage[]>([]);
 const [draft,setDraft]=useState("");
 const [error,setError]=useState("");
 const [tool,setTool]=useState<"move"|Terrain>("move");
 const [zoom,setZoom]=useState(.8);
 const [atlasOpen,setAtlasOpen]=useState(false);
 const socket=useRef<Socket|null>(null);
 const playerId=useRef("");
 useEffect(()=>()=>{socket.current?.disconnect();},[]);
 const connect=useCallback(()=>{
   if(name.trim().length<2){setError("Informe pelo menos 2 caracteres.");return;}
   const id=persistentId();playerId.current=id;
   sessionStorage.setItem("realmforge-name",name.trim());
   setError("");setJoined(true);setStatus("Conectando...");
   const client=io(API_URL,{
     auth:{playerId:id,name:name.trim(),role},reconnection:true,
     transports:["websocket","polling"]
   });
   socket.current=client;
   client.on("connect",()=>setStatus("Online"));
   client.on("disconnect",()=>setStatus("Reconectando..."));
   client.on("connect_error",()=>setError("Não foi possível alcançar o servidor."));
   client.on("world:error",(text:string)=>setError(text));
   client.on("world:scene",()=>setMessages([]));
   client.on("world:state",(state:WorldState)=>{setWorld(state);setStatus("Online");});
   client.on("chat:message",(msg:ChatMessage)=>setMessages(m=>[...m.slice(-79),msg]));
 },[name,role]);

 const command=useCallback((payload:WorldCommand)=>{
   socket.current?.emit("world:command",payload,(result:ActionResult)=>{
     if(!result?.ok)setError(result?.error??"Falha na ação.");
     else setError("");
   });
 },[]);
 const travel=useCallback((sceneId:string)=>{
   socket.current?.emit("world:travel",{sceneId},(r:ActionResult)=>{
     if(!r?.ok)setError(r?.error??"Falha na viagem.");
     else{setError("");setTool("move");}
   });
 },[]);
 const sendChat=useCallback(()=>{
   if(!draft.trim())return;
   socket.current?.emit("chat:send",draft,(r:ActionResult)=>{
     if(!r?.ok)setError(r?.error??"Falha no chat.");
   });
   setDraft("");
 },[draft]);

 if(!joined)return <main className="landing"><div className="welcome">
   <span className="eyebrow">ATLAS INTERATIVO · MUNDO PERSISTENTE</span>
   <div className="emblem">✦</div><h1>RealmForge</h1>
   <p className="subtitle">Jornada pela Terra-média · Cenários de demonstração</p>
   <div className="welcome-card">
     <h2>Iniciar jornada</h2>
     <label htmlFor="player-name">Nome do aventureiro</label>
     <input id="player-name" maxLength={32} value={name} onChange={e=>setName(e.target.value)}
       onKeyDown={e=>{if(e.key==="Enter")connect();}} placeholder="Nome do personagem"/>
     <label htmlFor="role">Entrar como</label>
     <select id="role" value={role} onChange={e=>setRole(e.target.value as Role)}>
       <option value="jogador">Jogador</option><option value="mestre">Mestre (demo local)</option>
     </select>
     {error&&<div className="alert" role="alert">{error}</div>}
     <button className="primary" onClick={connect}>Entrar no mapa →</button>
     <p className="tiny">Protótipo de desenvolvimento local sem controle de acesso.
      Não disponibilizar publicamente.</p>
   </div>
 </div></main>;

 const scene=sceneById(world?.sceneId??"");
 const exits=SCENE_NEXT(world?.sceneId??"");
 const me=world?.players[playerId.current];
 return <div className="game-shell">
   <header className="topbar">
     <div className="logo"><span className="logo-mark">✦</span> RealmForge <span className="top-tag">ATLAS ALFA</span></div>
     <div className="session-info"><span className="dot"/>{status}<span className="bar">│</span>
       {scene?.name??"Carregando"}<span className="bar">│</span>Revisão {world?.revision??"—"}</div>
   </header>
   <div className="layout">
     <aside className="sidebar left">
       <div className="panel-title">SOCIEDADE DO ANEL</div>
       <p className="panel-subtitle">Travessia da Terra-média</p>
       <button className="atlas-open" onClick={()=>setAtlasOpen(true)}>◈ Abrir atlas da jornada</button>
       <div className="section-heading">REGIÃO ATUAL</div>
       <div className="scene-card"><strong>{scene?.name??"..."}</strong>
         <p>{scene?.description}</p><small>Marco: {scene?.landmark}</small></div>
       <div className="section-heading">VIAGEM ENTRE CENAS</div>
       <p className="hint">Caminhe até a borda oeste ou leste da estrada para atravessar. Mestre pode viajar de qualquer lugar.</p>
       {exits.previous&&<button className="travel-button" onClick={()=>travel(exits.previous!.id)}>← {exits.previous.name}</button>}
       {exits.next&&<button className="travel-button" onClick={()=>travel(exits.next!.id)}>{exits.next.name} →</button>}
       <div className="section-heading">JOGADORES <span>{Object.keys(world?.players??{}).length}</span></div>
       <div className="player-list">{Object.values(world?.players??{}).map(p=>
         <div className={"player-item"+(p.id===playerId.current?" self":"")} key={p.id}>
           <span className="avatar" style={{backgroundColor:"#"+p.color.toString(16).padStart(6,"0")}}>{p.name[0]?.toUpperCase()}</span>
           <div><strong>{p.name}</strong><small>{p.id===playerId.current?"Você":"Aventureiro"}</small></div>
           <span className="online-circle"/>
         </div>)}</div>
       <div className="section-heading">FERRAMENTAS</div>
       <div className="tool-grid">
         <button className={tool==="move"?"tool selected":"tool"} onClick={()=>setTool("move")}>↗ <span>Mover</span></button>
         {role==="mestre"&&BRUSHES.map(b=><button key={b.id}
           className={tool===b.id?"tool selected":"tool"} onClick={()=>setTool(b.id)}>{b.icon}<span>{b.label}</span></button>)}
       </div>
       {role==="mestre"&&<p className="hint">Selecione o pincel e clique em tiles para editar. Mudanças são persistidas.</p>}
       <div className="sidebar-foot">14 MAPAS · 30 MARCOS DA VIAGEM</div>
     </aside>
     <main className="play-area">
       <div className="map-toolbar">
         <div><span className="crumb">{scene?.region??"MUNDO"}</span> / <strong>{scene?.name??"..."}</strong></div>
         <div className="zoom-tools">
           <button aria-label="Diminuir zoom" onClick={()=>setZoom(z=>Math.max(.5,z-.25))}>−</button>
           <span>{Math.round(zoom*100)}%</span>
           <button aria-label="Aumentar zoom" onClick={()=>setZoom(z=>Math.min(2,z+.25))}>+</button>
         </div>
       </div>
       <div className="map-content" tabIndex={0} onKeyDown={e=>{
         if(!me||tool!=="move")return;
         const moves:Record<string,[number,number]>={
           ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],
           ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]
         };
         const d=moves[e.key];if(d){e.preventDefault();command({type:"player.move",x:me.x+d[0],y:me.y+d[1]});}
       }}>
         {world?<MapCanvas key={world.sceneId} world={world} playerId={playerId.current}
           isMaster={role==="mestre"} tool={tool} onCommand={command} onTravel={travel} zoom={zoom}/>:
           <div className="loading">Carregando o mapa...</div>}
         <div className="map-hint">Clique para andar · WASD/setas · Portais nas bordas da estrada</div>
       </div>
       <div className="statusbar"><span>◉ {me?`Posição ${me.x}, ${me.y}`:"Conectando..."}</span>
         <span>{tool==="move"?"Exploração":"Edição: "+tool}</span></div>
     </main>
     <aside className="sidebar right">
       <div className="panel-title">DIÁRIO DE AVENTURA</div>
       <div className="section-heading">HISTÓRIA</div>
       <p className="lore">{scene?.description}</p>
       <p className="hint">Capítulo de referência: {scene?.chapter}</p>
       <div className="section-heading">ESTADO DO MUNDO</div>
       <div className="world-stats"><span>Cenas</span><strong>{SCENES.length}</strong></div>
       <div className="world-stats"><span>Área local</span><strong>{world?.width} × {world?.height}</strong></div>
       <div className="world-stats"><span>Portas</span><strong>{world?.doors.length}</strong></div>
       <div className="section-heading">CHAT DA CENA</div>
       <div className="chat-list" aria-live="polite">
         {messages.length===0&&<p className="hint">Nenhuma mensagem nesta cena.</p>}
         {messages.map(m=><div className="chat-message" key={m.id}><strong>{m.name}</strong><p>{m.text}</p></div>)}
       </div>
       <div className="chat-form">
         <input aria-label="Mensagem" placeholder="Enviar mensagem..." maxLength={300}
           value={draft} onChange={e=>setDraft(e.target.value)}
           onKeyDown={e=>{if(e.key==="Enter")sendChat();}}/>
         <button aria-label="Enviar" onClick={sendChat}>↗</button>
       </div>
     </aside>
   </div>
   {atlasOpen&&<JourneyAtlas currentSceneId={world?.sceneId??"hobbiton"} onClose={()=>setAtlasOpen(false)}/>}
   {error&&<div className="toast" role="alert"><span>{error}</span><button onClick={()=>setError("")}>×</button></div>}
 </div>;
}
