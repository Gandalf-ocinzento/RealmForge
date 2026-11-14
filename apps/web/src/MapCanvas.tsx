import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";
import {
  TILE_SIZE,SCENE_NEXT,type Terrain,type WorldState,type WorldCommand
} from "@realmforge/contracts";
interface Props {
 world:WorldState;playerId:string;isMaster:boolean;tool:"move"|Terrain;
 onCommand:(cmd:WorldCommand)=>void; zoom:number;
 onTravel:(sceneId:string)=>void;
}
const palette:Record<Terrain,number>={
 grass:0x436a46,road:0xb9a279,dirt:0x866b4a,water:0x3f7891,
 wall:0x5b5c57,forest:0x315f3d,tree:0x24482e,stone:0x89857b,
 snow:0xe3e4d8,floor:0xb0a28a,marsh:0x596c50,
 bridge:0xb58a60,mountain:0x62616a
};
function render(stage:Container,p:Props){
 const {world,playerId,isMaster,tool,onCommand,onTravel}=p;
 for(const child of stage.removeChildren()) child.destroy({children:true});
 const ts=TILE_SIZE,me=world.players[playerId];
 const route=SCENE_NEXT(world.sceneId);
 for(let y=0;y<world.height;y++){
   for(let x=0;x<world.width;x++){
     const t=world.terrain[y*world.width+x];
     const obj=new Graphics();
     const left=x*ts,top=y*ts;
     obj.rect(left,top,ts,ts).fill(palette[t]);
     obj.rect(left,top,ts,ts).stroke({color:0x152018,width:0.7,alpha:0.3});
     if(t==="grass"||t==="forest"){
       const n=(x*13+y*17)%7;
       if(n<3) obj.circle(left+7+n*5,top+7+n*3,1.5).fill({color:0xc4d0a0,alpha:0.45});
     }
     if(t==="water"){
       obj.moveTo(left+5,top+12).quadraticCurveTo(left+16,top+8,left+27,top+12)
          .stroke({color:0x94b5bb,width:1,alpha:0.5});
     }
     if(t==="tree"){
       obj.circle(left+16,top+17,11).fill(0x366b43).stroke({color:0x1b3f29,width:2});
       obj.circle(left+11,top+10,5).fill({color:0x709065,alpha:0.5});
     }
     if(t==="wall"){
       obj.rect(left+3,top+3,ts-6,ts-6).fill(0x67685d)
          .stroke({color:0xb0a790,width:1});
       obj.moveTo(left+3,top+ts/2).lineTo(left+ts-3,top+ts/2)
          .stroke({color:0x454940,width:1});
     }
     if(t==="road"||t==="bridge"){
       obj.circle(left+6,top+23,1).fill({color:0x6e5f4a,alpha:0.4});
     }
     obj.eventMode="static";obj.cursor="pointer";
     obj.on("pointertap",()=>{
       if(isMaster&&tool!=="move"){
         onCommand({type:"map.paint",x,y,terrain:tool});return;
       }
       if(!me)return;
       if(Math.abs(me.x-x)+Math.abs(me.y-y)===1)
         onCommand({type:"player.move",x,y});
     });
     stage.addChild(obj);
   }
 }
 // Portais na margem oeste e leste dos caminhos.
 for(const side of ["west","east"] as const){
   const destination=side==="west"?route.previous:route.next;
   if(!destination)continue;
   const x=side==="west"?0:world.width-1;
   const portal=new Graphics();
   portal.roundRect(x*ts+3,world.height*ts/2-28,ts-6,56,6)
      .fill({color:0xdec684,alpha:.82}).stroke({color:0x4e3922,width:2});
   // Faixa de entrada visual; o botão de viagem faz validação de borda no servidor.
   portal.eventMode="static";portal.cursor="pointer";
   portal.on("pointertap",()=>onTravel(destination.id));
   stage.addChild(portal);
 }
 for(const door of world.doors){
   const obj=new Graphics(),left=door.x*ts,top=door.y*ts;
   obj.roundRect(left+5,top+5,ts-10,ts-10,4)
      .fill(door.open?0x80c38c:0xdaaa5d).stroke({width:2,color:0x2d2a1e});
   obj.eventMode="static";obj.cursor="pointer";
   obj.on("pointertap",()=>onCommand({type:"door.toggle",doorId:door.id}));
   stage.addChild(obj);
 }
 for(const player of Object.values(world.players)){
   const px=player.x*ts+ts/2,py=player.y*ts+ts/2;
   const marker=new Graphics();
   marker.circle(px,py,player.id===playerId?12:10)
     .fill(player.color).stroke({width:3,color:0x17251b});
   marker.eventMode="none";stage.addChild(marker);
   const label=new Text({text:player.name.slice(0,1).toUpperCase(),style:{
     fontFamily:"Arial",fontSize:12,fontWeight:"bold",fill:0x152319
   }});
   label.anchor.set(.5);label.position.set(px,py);label.eventMode="none";
   stage.addChild(label);
 }
}
export function MapCanvas(props:Props){
 const host=useRef<HTMLDivElement>(null);
 const app=useRef<Application|null>(null);
 const stage=useRef<Container|null>(null);
 const current=useRef(props); current.current=props;
 useEffect(()=>{
   let live=true;
   const a=new Application();
   (async()=>{
     await a.init({
       width:current.current.world.width*TILE_SIZE,
       height:current.current.world.height*TILE_SIZE,
       background:"#1f3226",antialias:true
     });
     if(!live||!host.current){a.destroy(true);return;}
     const layer=new Container();a.stage.addChild(layer);
     app.current=a;stage.current=layer;host.current.appendChild(a.canvas);
     render(layer,current.current);
     a.canvas.style.width=(current.current.world.width*TILE_SIZE*current.current.zoom)+"px";
     a.canvas.style.height=(current.current.world.height*TILE_SIZE*current.current.zoom)+"px";
   })().catch(console.error);
   return()=>{live=false;app.current=null;stage.current=null;a.destroy(true,{children:true});};
 },[]);
 useEffect(()=>{
   if(!app.current||!stage.current)return;
   render(stage.current,props);
   app.current.canvas.style.width=(props.world.width*TILE_SIZE*props.zoom)+"px";
   app.current.canvas.style.height=(props.world.height*TILE_SIZE*props.zoom)+"px";
 },[props]);
 return <div className="map-scroll" aria-label="Mapa interativo com trilhas e portais">
   <div ref={host} className="map-host"/>
 </div>;
}
