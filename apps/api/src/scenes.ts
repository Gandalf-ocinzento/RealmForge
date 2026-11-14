import {
  MAP_HEIGHT, MAP_WIDTH, SCENES, sceneById, type Biome,
  type Terrain, type WorldState
} from "@realmforge/contracts";

const W = MAP_WIDTH;
const H = MAP_HEIGHT;
const mid = Math.floor(H / 2);
export const trailY = (x:number, seed:number) =>
  Math.max(2, Math.min(H-3, mid + Math.round(Math.sin(x / 6 + seed / 70) * 2)));

const rnd = (seed:number, x:number, y:number) => {
  const v = Math.sin((x * 73.1 + y * 191.9 + seed * 0.971)) * 43758.5453;
  return v - Math.floor(v);
};

function baseTerrain(biome:Biome, noise:number):Terrain {
  switch (biome) {
    case "dungeon": return "wall";
    case "mountain": return noise > 0.76 ? "mountain" : noise > 0.30 ? "snow" : "stone";
    case "river": return noise > 0.85 ? "forest" : "grass";
    case "ferry": return noise > 0.94 ? "tree" : noise > 0.65 ? "forest" : "grass";
    case "village": return noise > 0.83 ? "stone" : "grass";
    case "highland": case "barrows": case "hill": return noise > 0.72 ? "stone" : noise > 0.46 ? "grass" : "dirt";
    case "ruins": return noise > 0.72 ? "stone" : "grass";
    case "sanctuary": return noise > 0.90 ? "forest" : "grass";
    case "woodland": case "haunted": return noise > 0.76 ? "tree" : noise > 0.32 ? "forest" : "grass";
    case "goldenwood": return noise > 0.82 ? "tree" : "forest";
    default: return noise > 0.94 ? "tree" : noise > 0.75 ? "forest" : noise > 0.35 ? "grass" : "dirt";
  }
}

export function buildScene(sceneId:string): WorldState {
  const info = sceneById(sceneId);
  if (!info) throw new Error("Mapa desconhecido.");
  const tiles: Terrain[] = [];
  const idx=(x:number,y:number)=>y*W+x;
  const set=(x:number,y:number,t:Terrain)=>{
    if(x>=0&&x<W&&y>=0&&y<H) tiles[idx(x,y)]=t;
  };

  for(let y=0;y<H;y++) {
    for(let x=0;x<W;x++) {
      let t=baseTerrain(info.biome,rnd(info.seed,x,y));
      if(info.biome==="river" && x>=13 && x<=24) t="water";
      if(info.biome==="ferry" && x>=27 && x<=34) t="water";
      if(info.biome==="sanctuary" && x>=29 && x<=31) t="water";
      if(info.biome==="haunted" && y>=18 && y<=20) t="marsh";
      if(info.biome==="dungeon" && (
         (x>=4&&x<=13&&y>=4&&y<=18) ||
         (x>=18&&x<=31&&y>=3&&y<=19)
      )) t="floor";
      tiles.push(t);
    }
  }

  // Estrada do oeste ao leste; progressão tile a tile em terreno transitável.
  for(let x=0;x<W;x++){
    for(let off=-1;off<=1;off++){
      const y=trailY(x, info.seed)+off;
      let terrain:Terrain="road";
      if(info.biome==="dungeon") terrain="floor";
      else if((info.biome==="river"&&x>=13&&x<=24) ||
        (info.biome==="ferry"&&x>=27&&x<=34)) terrain="bridge";
      else if(info.biome==="mountain") terrain="snow";
      set(x,y,terrain);
    }
  }
  // Clareiras e locais visitáveis desenhados como footprints próprios.
  if(["meadow","village","ferry","sanctuary"].includes(info.biome)){
    const houses = info.biome==="village" ?
      [[5,3,11,8],[22,4,29,9],[9,16,15,20],[23,16,30,20]] :
      [[5,3,12,8],[22,16,29,21]];
    for(const [x0,y0,x1,y1] of houses){
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        set(x,y, x===x0||x===x1||y===y0||y===y1 ? "wall" : "floor");
      }
    }
  }
  if(["barrows","highland","ruins","hill"].includes(info.biome)){
    // Ruínas em círculo irregular, sem arte de mapas publicados.
    for(let y=4;y<=9;y++)for(let x=22;x<=29;x++){
      const d=Math.hypot(x-25.5,y-6.5);
      if(d>=2.8&&d<=3.7) set(x,y,"wall");
      else if(d<2.8) set(x,y,"stone");
    }
  }
  // Segunda passagem: nunca bloquear o caminho pela malha procedural.
  for(let x=0;x<W;x++)for(let off=-1;off<=1;off++){
    const y=trailY(x, info.seed)+off;
    set(x,y,
      info.biome==="dungeon" ? "floor" :
      ((info.biome==="river"&&x>=13&&x<=24) ||
       (info.biome==="ferry"&&x>=27&&x<=34)) ? "bridge" :
      info.biome==="mountain" ? "snow" : "road");
  }
  const doors = ["village","sanctuary","dungeon"].includes(info.biome) ? [{
    id: "gate-"+info.id, x: 17, y:trailY(17,info.seed), open:false
  }] : [];
  return {
    sceneId:info.id,revision:0,width:W,height:H,
    terrain:tiles,doors,players:{}
  };
}

export function spawnPoint(sceneId:string, arrival:"west"|"east"="west"){
  const scene=sceneById(sceneId);
  if(!scene) throw new Error("Mapa desconhecido.");
  const x=arrival==="east" ? W-3 : 2;
  return { x, y:trailY(x,scene.seed) };
}
