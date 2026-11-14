import { JOURNEY, SCENES, type JourneyStop } from "@realmforge/contracts";
import { useState } from "react";
interface Props {
  currentSceneId:string;
  onClose:()=>void;
}
export function JourneyAtlas({currentSceneId,onClose}:Props) {
  const [selected,setSelected]=useState<JourneyStop>(JOURNEY.find(s=>s.sceneId===currentSceneId)??JOURNEY[0]);
  const xs=JOURNEY.map(s=>s.x),ys=JOURNEY.map(s=>s.y);
  const path=JOURNEY.map(s=>s.x+","+s.y).join(" ");
  const scene=SCENES.find(s=>s.id===selected.sceneId);
  return <div className="atlas-backdrop" role="dialog" aria-modal="true" aria-label="Atlas da jornada">
    <div className="atlas-panel">
      <div className="atlas-header">
        <div><span className="eyebrow">CARTOGRAFIA DE CAMPANHA</span><h2>Atlas da Sociedade</h2></div>
        <button onClick={onClose} className="atlas-close" aria-label="Fechar atlas">×</button>
      </div>
      <div className="atlas-scroll">
        <div className="atlas-parchment">
          <svg className="atlas-svg" viewBox="40 75 960 620" role="img" aria-label="Percurso esquemático do Condado até Amon Hen">
            <defs>
              <pattern id="grain" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="6" cy="9" r=".6" fill="#8c764f" opacity=".28" />
                <circle cx="25" cy="22" r=".7" fill="#8c764f" opacity=".2" />
              </pattern>
              <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity=".2"/></filter>
            </defs>
            <rect x="40" y="75" width="960" height="620" fill="#dfd0a8" rx="6"/>
            <rect x="40" y="75" width="960" height="620" fill="url(#grain)"/>
            <g opacity=".22" fill="none" stroke="#796c4e">
              {Array.from({length:11},(_,i)=><path key={i} d={`M ${60+i*91} 100 q 25 160 0 320 q-25 100 10 250`} strokeWidth="1.2" />)}
              {Array.from({length:7},(_,i)=><path key={i} d={`M 58 ${113+i*90} q 300 -50 570 0 q200 40 348 -15`} strokeWidth=".9" />)}
            </g>
            <path d="M 612 225 Q 665 285 630 358 Q 660 423 712 466 L 756 500 Q 740 550 840 600"
              stroke="#716c60" strokeWidth="32" opacity=".12" fill="none"/>
            <path d="M 856 483 Q 838 540 880 565 Q 906 603 954 664" stroke="#638394" strokeWidth="15" opacity=".45" fill="none"/>
            <g fontFamily="Georgia,serif" fill="#705f42" fontSize="20" fontWeight="bold" opacity=".7">
              <text x="106" y="130">CONDADO</text>
              <text x="329" y="179">ERIADOR</text>
              <text x="545" y="190">MONTANHAS SOMBRIAS</text>
              <text x="715" y="405">MORIA</text>
              <text x="755" y="460">LÓRIEN</text>
              <text x="855" y="530">ANDUIN</text>
            </g>
            <polyline points={path} stroke="#5f4e30" strokeWidth="8" opacity=".16" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points={path} stroke="#9c693d" strokeWidth="3.5" strokeDasharray="8 5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {JOURNEY.map((stop,i)=><g key={stop.id} role="button" tabIndex={0}
              onClick={()=>setSelected(stop)}
              onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setSelected(stop);}}
              style={{cursor:"pointer"}}>
              <circle cx={stop.x} cy={stop.y} r={stop.id===selected.id?10:stop.sceneId?6.8:4.5}
                fill={stop.sceneId===currentSceneId?"#286343":stop.id===selected.id?"#d9a65d":stop.sceneId?"#7e3b2b":"#b9a37b"}
                stroke="#f1e4c3" strokeWidth="2.5" filter="url(#shadow)"/>
              {(stop.sceneId||i%4===0)&&
              <text x={stop.x+8} y={stop.y-9} fill="#483b28" fontSize="11" fontWeight="bold"
                fontFamily="Georgia,serif">{stop.label}</text>}
            </g>)}
            <g fill="#6c5b3d" fontFamily="Georgia,serif">
              <text x="76" y="664" fontSize="15">Roteiro esquemático • Distâncias não proporcionais</text>
            </g>
          </svg>
        </div>
      </div>
      <div className="atlas-detail">
        <div><strong>{selected.label}</strong><p>{selected.date} · {selected.note}</p>
          {scene&&<span className="atlas-tag">Cena local preparada: {scene.name}</span>}
        </div>
        <div className="atlas-legend">● Você está aqui &nbsp; · &nbsp; ● Cenas jogáveis &nbsp; · &nbsp; · Marcos narrativos</div>
      </div>
      <div className="atlas-footer"><button className="primary" onClick={onClose}>Voltar à aventura</button></div>
    </div>
  </div>;
}
