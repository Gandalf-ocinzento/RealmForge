import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  type Role, type Terrain, type WorldCommand, type WorldState,
  type ChatMessage, type ActionResult,
} from "@realmforge/contracts";
import { MapCanvas } from "./MapCanvas";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const BRUSHES: Array<{ id: Terrain; label: string; icon: string }> = [
  { id: "grass", label: "Grama", icon: "🌱" },
  { id: "road", label: "Estrada", icon: "🛤" },
  { id: "dirt", label: "Terra", icon: "🟤" },
  { id: "water", label: "Água", icon: "💧" },
  { id: "wall", label: "Parede", icon: "🧱" }
];

function persistentId() {
  const saved = sessionStorage.getItem("realmforge-player-id");
  if (saved) return saved;
  const id = "p_" + crypto.randomUUID().replaceAll("-", "");
  sessionStorage.setItem("realmforge-player-id", id);
  return id;
}

export function App() {
  const [name, setName] = useState(() => sessionStorage.getItem("realmforge-name") ?? "");
  const [role, setRole] = useState<Role>("jogador");
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState("Desconectado");
  const [world, setWorld] = useState<WorldState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [tool, setTool] = useState<"move" | Terrain>("move");
  const [zoom, setZoom] = useState(1);
  const socket = useRef<Socket | null>(null);
  const playerId = useRef<string>("");

  useEffect(() => {
    return () => { socket.current?.disconnect(); };
  }, []);

  const connect = useCallback(() => {
    if (name.trim().length < 2) { setError("Informe um nome com pelo menos 2 letras."); return; }
    const id = persistentId();
    playerId.current = id;
    sessionStorage.setItem("realmforge-name", name.trim());
    setError("");
    setStatus("Conectando...");
    setJoined(true);
    const client = io(API_URL, {
      auth: { playerId: id, name: name.trim(), role },
      reconnection: true, reconnectionAttempts: 10,
      transports: ["websocket", "polling"]
    });
    socket.current = client;
    client.on("connect", () => setStatus("Online"));
    client.on("disconnect", () => setStatus("Reconectando..."));
    client.on("connect_error", () => setError("Não foi possível alcançar o servidor. Confira se a API está ativa."));
    client.on("world:error", (message: string) => setError(message));
    client.on("world:state", (state: WorldState) => {
      setWorld(state);
      setStatus("Online");
    });
    client.on("chat:message", (message: ChatMessage) => {
      setMessages(m => [...m.slice(-79), message]);
    });
  }, [name, role]);

  const command = useCallback((payload: WorldCommand) => {
    socket.current?.emit("world:command", payload, (result: ActionResult) => {
      if (!result.ok) setError(result.error ?? "Não foi possível executar a ação.");
      else setError("");
    });
  }, []);

  const sendChat = useCallback(() => {
    if (!draft.trim()) return;
    socket.current?.emit("chat:send", draft, (result: ActionResult) => {
      if (!result.ok) setError(result.error ?? "Falha no chat");
    });
    setDraft("");
  }, [draft]);

  if (!joined) return (
    <main className="landing">
      <div className="welcome">
        <span className="eyebrow">MUNDO PERSISTENTE · RPG ONLINE</span>
        <div className="emblem">✦</div>
        <h1>RealmForge</h1>
        <p className="subtitle">Forje sua história. Explore um mundo que se lembra.</p>
        <div className="welcome-card">
          <h2>Entrar no mundo</h2>
          <label htmlFor="player-name">Nome de aventureiro</label>
          <input id="player-name" maxLength={32} value={name} placeholder="Como devemos chamar você?"
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && connect()} />
          <label htmlFor="role">Entrar como</label>
          <select id="role" value={role} onChange={e => setRole(e.target.value as Role)}>
            <option value="jogador">Jogador</option><option value="mestre">Mestre (demo)</option>
          </select>
          {error && <div className="alert" role="alert">{error}</div>}
          <button className="primary" onClick={connect}>Entrar na vila →</button>
          <p className="tiny">Protótipo local. Não há login nem autorização de Mestre nesta etapa.</p>
        </div>
      </div>
    </main>
  );

  const me = world?.players[playerId.current];
  return <div className="game-shell">
    <header className="topbar">
      <div className="logo"><span className="logo-mark">✦</span> RealmForge <span className="top-tag">ALFA · 0.1</span></div>
      <div className="session-info"><span className="dot" /> {status} <span className="bar">│</span> Vila da Fronteira <span className="bar">│</span> Revisão {world?.revision ?? "—"}</div>
    </header>
    <div className="layout">
      <aside className="sidebar left">
        <div className="panel-title">SALA DE JOGO</div>
        <p className="panel-subtitle">Um mundo. Muitas histórias.</p>
        <div className="section-heading">PERSONAGENS <span>{Object.keys(world?.players ?? {}).length}</span></div>
        <div className="player-list">
          {Object.values(world?.players ?? {}).map(p =>
            <div key={p.id} className={"player-item" + (p.id === playerId.current ? " self" : "")}>
              <span className="avatar" style={{ backgroundColor: "#" + p.color.toString(16).padStart(6, "0") }}>{p.name[0]?.toUpperCase()}</span>
              <div><strong>{p.name}</strong><small>{p.id === playerId.current ? "Você" : "Aventureiro"}</small></div>
              <span className="online-circle" />
            </div>
          )}
        </div>
        <div className="section-heading">FERRAMENTAS</div>
        <div className="tool-grid">
          <button className={tool === "move" ? "tool selected" : "tool"} onClick={() => setTool("move")}>↗ <span>Mover</span></button>
          {role === "mestre" && BRUSHES.map(b =>
            <button key={b.id} className={tool === b.id ? "tool selected" : "tool"} onClick={() => setTool(b.id)}>
              {b.icon} <span>{b.label}</span>
            </button>)}
        </div>
        {role === "mestre" && <p className="hint">Modo Mestre: selecione um terreno e clique nas casas para pintar.</p>}
        <div className="section-heading">LOCALIZAÇÃO</div>
        <p className="location">◉ Vila da Fronteira</p>
        <p className="hint">Use as setas ou WASD para caminhar. Clique na porta dourada para interagir.</p>
        <div className="sidebar-foot">REINO EXPERIMENTAL · DEMO LOCAL</div>
      </aside>
      <main className="play-area">
        <div className="map-toolbar">
          <div><span className="crumb">MUNDO</span> / <strong>Vila da Fronteira</strong></div>
          <div className="zoom-tools">
            <button aria-label="Diminuir zoom" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button aria-label="Aumentar zoom" onClick={() => setZoom(z => Math.min(2, +(z + 0.25).toFixed(2)))}>+</button>
          </div>
        </div>
        <div className="map-content" tabIndex={0} onKeyDown={e => {
          if (!me || tool !== "move") return;
          const dirs: Record<string, [number, number]> = {
            ArrowUp: [0,-1], w: [0,-1], ArrowDown: [0,1], s: [0,1],
            ArrowLeft: [-1,0], a: [-1,0], ArrowRight: [1,0], d: [1,0]
          };
          const d = dirs[e.key];
          if (d) { e.preventDefault(); command({ type: "player.move", x: me.x + d[0], y: me.y + d[1] }); }
        }}>
          {world
            ? <MapCanvas world={world} playerId={playerId.current} isMaster={role === "mestre"} tool={tool} onCommand={command} zoom={zoom} />
            : <div className="loading">Carregando o mundo...</div>}
          <div className="map-hint">Clique no mapa para mover · clique nas portas para interagir</div>
        </div>
        <div className="statusbar">
          <span>◉ {me ? `Posição ${me.x}, ${me.y}` : "Conectando..."}</span>
          <span>{tool === "move" ? "Exploração" : "Edição: " + tool}</span>
        </div>
      </main>
      <aside className="sidebar right">
        <div className="panel-title">DIÁRIO DE AVENTURA</div>
        <div className="section-heading">SOBRE O MUNDO</div>
        <p className="lore">Uma pequena vila na fronteira de um reino antigo. Suas estradas testemunham histórias ainda não contadas.</p>
        <div className="section-heading">ESTADO</div>
        <div className="world-stats"><span>Território</span><strong>{world?.width ?? 0} × {world?.height ?? 0}</strong></div>
        <div className="world-stats"><span>Portas</span><strong>{world?.doors.length ?? 0}</strong></div>
        <div className="world-stats"><span>Seu papel</span><strong>{role === "mestre" ? "Mestre" : "Jogador"}</strong></div>
        <div className="section-heading">CHAT DA MESA</div>
        <div className="chat-list" aria-live="polite">
          {messages.length === 0 && <p className="hint">As mensagens desta sessão aparecerão aqui.</p>}
          {messages.map(m => <div className="chat-message" key={m.id}><strong>{m.name}</strong><p>{m.text}</p></div>)}
        </div>
        <div className="chat-form">
          <input aria-label="Mensagem para o chat" placeholder="Escreva uma mensagem..." maxLength={300}
            value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendChat()} />
          <button onClick={sendChat} aria-label="Enviar mensagem">↗</button>
        </div>
      </aside>
    </div>
    {error && <div className="toast" role="alert"><span>{error}</span><button onClick={() => setError("")}>×</button></div>}
  </div>;
}
