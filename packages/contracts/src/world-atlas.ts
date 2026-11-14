/**
 * Atlas esquemático e mapas originais para prototipagem do RealmForge.
 * Coordenadas dos marcos são de DESIGN, não geográficas/canônicas.
 * Os marcos se baseiam na cronologia de A Sociedade do Anel.
 */
export type Biome =
  | "meadow" | "woodland" | "ferry" | "haunted" | "barrows"
  | "village" | "highland" | "sanctuary" | "ruins"
  | "mountain" | "dungeon" | "goldenwood" | "river" | "hill";

export interface SceneInfo {
  id: string;
  name: string;
  region: string;
  description: string;
  biome: Biome;
  seed: number;
  landmark: string;
  chapter: string;
}

export const SCENES: SceneInfo[] = [
  { id:"hobbiton", name:"Hobbiton", region:"O Condado", biome:"meadow", seed: 112, landmark:"Bolsão e o caminho da Colina", chapter:"Uma Festa Muito Esperada", description:"Colinas verdes, hortas, casas e estradas tranquilas de uma terra que ainda desconhece a guerra." },
  { id:"woody-end", name:"Woody End", region:"O Condado", biome:"woodland", seed: 236, landmark:"Bosque dos encontros", chapter:"Três Não É Demais", description:"Bosques e trilhas onde viajantes se escondem de visitantes indesejados." },
  { id:"bucklebury", name:"Bucklebury", region:"Fronteira do Condado", biome:"ferry", seed: 321, landmark:"Travessia do Brandevin", chapter:"Um Atalho para os Cogumelos", description:"Caminhos rurais junto ao rio, passagens e a balsa que leva ao leste." },
  { id:"old-forest", name:"Floresta Velha", region:"Eriador", biome:"haunted", seed: 418, landmark:"Salgueiro ancestral", chapter:"A Floresta Velha", description:"Trilhas tortuosas sob copas antigas, com clareiras e obstáculos densos." },
  { id:"barrow-downs", name:"Colinas dos Túmulos", region:"Eriador", biome:"barrows", seed: 592, landmark:"Túmulo de pedra", chapter:"Névoa sobre as Colinas dos Túmulos", description:"Terras onduladas, círculos de pedras e entradas de túmulos." },
  { id:"bree", name:"Bri", region:"Eriador", biome:"village", seed: 640, landmark:"Pônei Saltitante", chapter:"Na Estalagem do Pônei Saltitante", description:"Vila fortificada com estalagem, pátios, casas e vielas iluminadas." },
  { id:"weathertop", name:"Topo do Vento", region:"Eriador", biome:"highland", seed: 731, landmark:"Ruínas de Amon Sûl", chapter:"Uma Faca no Escuro", description:"Encosta rochosa e ruínas de uma torre de vigia sobre as terras vazias." },
  { id:"rivendell", name:"Valfenda", region:"Montanhas Sombrias", biome:"sanctuary", seed: 862, landmark:"Casa de Elrond", chapter:"O Conselho de Elrond", description:"Pontes, riachos, jardins e salões num vale protegido." },
  { id:"eregion", name:"Eregion", region:"Eregion", biome:"ruins", seed: 905, landmark:"Caminho dos azevinhos", chapter:"O Anel Vai para o Sul", description:"Terras abertas com pedras antigas e marcas de uma civilização desaparecida." },
  { id:"caradhras", name:"Caradhras", region:"Montanhas Sombrias", biome:"mountain", seed: 1042, landmark:"Passagem da Montanha Vermelha", chapter:"O Anel Vai para o Sul", description:"Encostas cobertas de neve e um passo perigoso que termina em retirada." },
  { id:"moria", name:"Moria", region:"Montanhas Sombrias", biome:"dungeon", seed: 1187, landmark:"Câmara de Mazarbul", chapter:"Uma Jornada no Escuro", description:"Salões de pedra, portas, pontes, colunas e trechos de uma mina abandonada." },
  { id:"lothlorien", name:"Lothlórien", region:"Lothlórien", biome:"goldenwood", seed: 1223, landmark:"Bosque das árvores douradas", chapter:"Lothlórien", description:"Árvores altas, caminhos élficos e clareiras à beira de riachos." },
  { id:"anduin", name:"Rio Anduin", region:"Vale do Anduin", biome:"river", seed: 1380, landmark:"Travessia e acampamento", chapter:"O Grande Rio", description:"Curso extenso de água com margens, pedras e passagem para embarcações." },
  { id:"amon-hen", name:"Amon Hen", region:"Nen Hithoel", biome:"hill", seed: 1455, landmark:"Colina da Visão", chapter:"A Ruptura da Sociedade", description:"Bosques, ruínas e trilhas sobre a colina onde os caminhos da Sociedade se separam." },
];

export const SCENE_ORDER = SCENES.map(s => s.id);
export const DEFAULT_SCENE_ID = SCENES[0].id;
export const sceneById = (id: string) => SCENES.find(s => s.id === id);
export const canTravel = (from: string, to: string) => {
  const a = SCENE_ORDER.indexOf(from);
  const b = SCENE_ORDER.indexOf(to);
  return a >= 0 && b >= 0 && Math.abs(a - b) === 1;
};

export interface JourneyStop {
  id: string;
  label: string;
  date: string;
  x: number;
  y: number;
  sceneId?: string;
  note: string;
}
// Um mapa esquemático original (escala não uniforme); x/y apenas para interface.
const STOPS: Array<[string,string,string,number,number,string?,string?]> = [
  ["bag-end","Hobbiton","23 set. 3018",95,160,"hobbiton","Partida dos hobbits."],
  ["green-hills","Colinas Verdes","24 set. 3018",133,171,undefined,"Estradas e atalhos pelo Condado."],
  ["woody-end","Woody End","24 set. 3018",166,178,"woody-end","Encontro com os elfos nas trilhas."],
  ["bamfurlong","Bamfurlong","25 set. 3018",190,195,undefined,"Fazenda e acolhida do fazendeiro Maggot."],
  ["bucklebury","Balsa de Bucklebury","25 set. 3018",216,203,"bucklebury","Travessia do rio Brandevin."],
  ["crickhollow","Crickhollow","25 set. 3018",241,207,undefined,"Última parada antes da Floresta Velha."],
  ["old-forest","Floresta Velha","26 set. 3018",266,215,"old-forest","Trilhas confusas e árvores antigas."],
  ["withywindle","Withywindle","26 set. 3018",285,239,undefined,"O vale do Salgueiro Ancião."],
  ["bombadil","Casa de Tom Bombadil","26–28 set. 3018",305,229,undefined,"Refúgio à saída do bosque."],
  ["barrows","Colinas dos Túmulos","28 set. 3018",331,227,"barrow-downs","Névoa e criptas."],
  ["bree","Bri","29–30 set. 3018",365,230,"bree","Encontro com Passolargo na estalagem."],
  ["midgewater","Pântanos de Midgewater","1–2 out. 3018",405,238,undefined,"Travessia dos pântanos."],
  ["weathertop","Topo do Vento","6 out. 3018",448,251,"weathertop","Ataque noturno no antigo posto de vigia."],
  ["last-bridge","Última Ponte","13 out. 3018",499,249,undefined,"Passagem sobre o Mitheithel."],
  ["trollshaws","Trollshaws","17–18 out. 3018",545,259,undefined,"Florestas e encontro com Glorfindel."],
  ["ford-bruinen","Vau do Bruinen","20 out. 3018",586,271,undefined,"Travessia do rio sob perseguição."],
  ["rivendell","Valfenda","20 out.–25 dez. 3018",620,279,"rivendell","Conselho e partida da Sociedade."],
  ["hollin","Hollin / Eregion","8 jan. 3019",614,327,"eregion","Percurso para o sul, próximo às montanhas."],
  ["caradhras","Caradhras","11–12 jan. 3019",643,365,"caradhras","Tentativa frustrada de cruzar a montanha."],
  ["moria-gates","Portas de Moria","13 jan. 3019",672,402,"moria","Entrada nas minas subterrâneas."],
  ["mazarbul","Câmara de Mazarbul","15 jan. 3019",702,422,undefined,"Câmara e registros de Balin."],
  ["khazad-dum","Ponte de Khazad-dûm","15 jan. 3019",725,443,undefined,"Travessia da ponte sobre o abismo."],
  ["dimrill","Dimrill Dale","15 jan. 3019",752,469,undefined,"Saída das minas e vale oriental."],
  ["nimrodel","Nimrodel","15 jan. 3019",778,480,undefined,"Riacho na fronteira da floresta."],
  ["cerin","Cerin Amroth","16 jan. 3019",807,486,undefined,"Coração de Lothlórien."],
  ["caras","Caras Galadhon","17 jan.–16 fev. 3019",832,499,"lothlorien","Refúgio junto aos elfos de Lórien."],
  ["egladil","Egladil","16 fev. 3019",846,529,undefined,"A Sociedade embarca no Anduin."],
  ["sarn","Sarn Gebir","23 fev. 3019",877,544,"anduin","Encontro perigoso no Grande Rio."],
  ["argonath","Argonath","25 fev. 3019",912,574,undefined,"Passagem entre os gigantescos pilares."],
  ["parth-galen","Parth Galen / Amon Hen","25–26 fev. 3019",931,606,"amon-hen","Ruptura da Sociedade."],
];
export const JOURNEY: JourneyStop[] = STOPS.map(([id,label,date,x,y,sceneId,note]) => ({
  id,label,date,x,y,sceneId,note: note ?? ""
}));

export const SCENE_NEXT = (id: string) => {
  const n = SCENE_ORDER.indexOf(id);
  return {
    previous: n > 0 ? SCENES[n - 1] : null,
    next: n >= 0 && n + 1 < SCENES.length ? SCENES[n + 1] : null
  };
};
