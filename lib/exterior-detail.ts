import * as T from 'three';

// Plan topology and video references are recorded in docs/EXTERIOR.md.
// Front opening proportions traced from PRE.AH.01; side openings from PRE.AH.03 (received 19 Oct 2026).
// Floor-4 terrace perimeter follows the owner-marked plan; unsurveyed depths remain illustrative.
export const buildingBlocks=[{id:1,x:22,w:22,levels:4,z:0},{id:2,x:0,w:22,levels:5,z:0},{id:3,x:-21,w:20,levels:5,z:0}];
type Palette=Record<string,T.Material>;
type Opening={x:number;w:number;sill:number;h:number;panes?:number};
export function detailExterior(structure:T.Group,m:Palette){
 const counts={sideWindows:0,rearWindows:0,garagePortals:0,stairCores:0,sideBalconies:0,balconyEndWalls:0,flushEndWalls:0,frontEntrances:[] as {x:number;y:number}[]};
 function box(p:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat='plaster'){
  if(w<=0||h<=0||d<=0)return;
  const o=new T.Mesh(new T.BoxGeometry(w,h,d),m[mat]);o.position.set(x,y,z);o.castShadow=mat!=='glass';o.receiveShadow=true;p.add(o);return o;
 }
 function rail(p:T.Object3D,length:number,x:number,y:number,z:number,angle=0){
  const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;p.add(g);
  for(const h of [.1,1.05])box(g,length,.045,.055,0,h,0,'graphite');
  const n=Math.ceil(length/.14);for(let i=0;i<=n;i++)box(g,.025,1,.035,-length/2+i*length/n,.55,0,'graphite');
 }
 function glazing(p:T.Object3D,o:Opening,base:number){
  const y=base+o.sill+o.h/2;
  box(p,o.w,o.h,.035,o.x,y,0,'glass');
  for(const x of [o.x-o.w/2,o.x+o.w/2])box(p,.065,o.h+.08,.15,x,y,.025,'graphite');
  for(const h of [base+o.sill,base+o.sill+o.h])box(p,o.w+.1,.065,.15,o.x,h,.025,'graphite');
  const panes=o.panes??Math.max(2,Math.ceil(o.w/1.3));for(let i=1;i<panes;i++)box(p,.04,o.h,.1,o.x-o.w/2+i*o.w/panes,y,.03,'graphite');
  box(p,o.w+.16,.06,.28,o.x,base+o.sill-.055,.06,'stone');
  if(o.h>1.8){box(p,.035,.24,.07,o.x+.12,y-.2,.11,'graphite');box(p,o.w+.1,.18,.20,o.x,base+o.sill+o.h+.12,-.08,'plaster');}
 }
 // Wall panels stop at each opening: glazing is not pasted over solid walls.
 function facade(p:T.Object3D,length:number,height:number,base:number,x:number,z:number,angle:number,openings:Opening[],finish='plaster'){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;p.add(g);let edge=-length/2;
  for(const o of [...openings].sort((a,b)=>a.x-b.x)){
   const left=o.x-o.w/2,right=o.x+o.w/2;
   box(g,left-edge,height,.25,(edge+left)/2,base+height/2,0,finish);
   box(g,o.w,o.sill,.25,o.x,base+o.sill/2,0,finish);
   const lintel=height-o.sill-o.h;box(g,o.w,lintel,.25,o.x,base+o.sill+o.h+lintel/2,0,finish);
   glazing(g,o,base);edge=right;
  }
  box(g,length/2-edge,height,.25,(edge+length/2)/2,base+height/2,0,finish);return g;
 }
 for(const b of buildingBlocks){
  const g=new T.Group();g.position.set(b.x,0,b.z);structure.add(g);
  const first=b.id===1?0:b.id===2?1:2;
  for(let f=0;f<=b.levels;f++){
   const base=f*3.05;
   // Roof only covers the enclosed penthouse; the eastern strip is open terrace.
   const roofCut=b.id===2&&f===b.levels;
   box(g,roofCut?15.68:b.w+.28,.22,13.2,roofCut?-3.3:0,base,0);
   if(b.id===1&&f===b.levels)box(g,1.85,.22,13.12,b.w/2+.78,base,0);
   if(f===b.levels)continue;
   const penthouse=b.id===2&&f===4,width=penthouse?15.4:b.w,center=penthouse?-3.3:0;
   if(penthouse){
    box(g,6.6,.15,13,7.7,base+.18,0,'stone');
    // Continuous orange perimeter: front, eastern return and short rear return.
    rail(g,6.6,7.7,base+.2,6.32);
    rail(g,12.64,11,base+.2,0,Math.PI/2);
    rail(g,6.6,7.7,base+.2,-6.32);
   }
   if(f>=first){
    // Window-map spans in a common elevation reference (PRE.AH.01).
    const elevationOpenings=(spans:number[][],left:number,right:number):Opening[]=>spans.map(([a,b,panes])=>({x:((a+b)/2-left)/(right-left)*bWidth-bWidth/2,w:(b-a)/(right-left)*bWidth,sill:.16,h:2.34,panes}));
    const bWidth=b.w;
    const front:Opening[]=b.id===1?
     (f===0?[...elevationOpenings([[1295,1410,4],[1417,1493,2],[1497,1541,2],[1548,1586,2],[1591,1668,2],[1676,1730,2]],1114,1788),{x:-9.53,w:2.42,sill:0,h:2.5},{x:-6.65,w:2.74,sill:0,h:2.5}]:
      [...elevationOpenings(f===2?[[1122,1196,3],[1204,1253,2],[1292,1408,4],[1417,1540,4]]:[[1122,1170,2],[1205,1253,2],[1292,1408,4],[1417,1540,4]],1114,1788),{x:8.65,w:2.94,sill:1.45,h:.82,panes:4}]):
     (penthouse?[{x:-8.93,w:3.70,panes:4},{x:-5.56,w:2.74,panes:3},{x:-2.59,w:2.74,panes:3},{x:1.70,w:5.40,panes:4}].map(o=>({...o,x:o.x-center,sill:.16,h:2.34})):
      elevationOpenings(f===2?[[524,574,2],[606,656,2],[694,812,4],[820,938,4],[945,996,2],[1030,1080,2]]:[[548,598,2],[636,686,2],[694,812,4],[820,938,4],[945,996,2],[1030,1080,2]],520,1114));
    const flushWest=b.id===3;
    if(flushWest){
     // VE125/VE113: narrow vertical openings; VE104: wide opening at the lower occupied level.
     const split=-1.3,leftWidth=split+b.w/2,leftCenter=(split-b.w/2)/2;
     const leftOpening=f===2?{x:1.45,w:4.25,sill:.16,h:2.34,panes:3}:{x:2.95,w:1.2,sill:.16,h:2.34,panes:1};
     facade(g,leftWidth,2.83,base+.12,leftCenter,6.32,0,[leftOpening]);
     facade(g,b.w/2-split,2.83,base+.12,(split+b.w/2)/2,4.5,0,[{x:-2,w:6.8,sill:.16,h:2.34,panes:4},{x:3.45,w:3.5,sill:.16,h:2.34,panes:2}]);
     rail(g,b.w/2-split,(split+b.w/2)/2,base+.2,6.32);
     box(g,.20,2.83,1.82,split,base+1.535,5.41);
    }
    // Owner's annotated elevation: the right-hand solid bay is flush with the balcony edge.
    const flushEnd=b.id===1&&f>=1;
    if(flushEnd){
     const split=(1542-1114)/(1788-1114)*b.w-b.w/2;
     facade(g,split+b.w/2,2.83,base+.12,(split-b.w/2)/2,4.5,0,front.filter(o=>o.x<split).map(o=>({...o,x:o.x-(split-b.w/2)/2})));
     facade(g,b.w/2-split,2.83,base+.12,(split+b.w/2)/2,6.32,0,[{x:-1.15,w:2.94,sill:1.45,h:.82,panes:4}]);
     box(g,.20,2.83,1.82,split,base+1.535,5.41);
     rail(g,split+b.w/2,(split-b.w/2)/2,base+.2,6.32);counts.flushEndWalls++;
    }else if(!flushWest){facade(g,width,2.83,base+.12,center,4.5,0,front);if(b.id===1&&f===0)rail(g,16.08,2.96,base+.2,6.32);else rail(g,width,center,base+.2,6.32);}
    if(b.id===1&&f===0){
     // Accesses occupy the left end of building 1 in PRE.AH.01, not building 2.
     const garageX=-9.53,doorX=-6.65;
     box(g,2.42,2.45,.08,garageX,1.25,4.62,'graphite');
     for(let i=0;i<15;i++)box(g,2.38,.025,.025,garageX,.12+i*.16,4.68,'stone');
     box(g,2.64,2.45,.08,doorX,1.25,4.62,'graphite');
     box(g,1.95,1.6,.03,doorX,1.47,4.68,'glass');
     box(g,.04,.55,.08,doorX+.9,1.15,4.74,'stone');
     box(g,.16,.29,.08,doorX+1.43,1.4,4.7,'graphite');
     box(g,5.7,.12,2.35,-8.1,.04,5.6,'stone');
     counts.garagePortals++;counts.frontEntrances.push({x:b.x+doorX,y:base});
    }
    for(const x of (penthouse?[-11,4.4]:flushWest?[-1.3,5.5,10]:(b.id===1?[-11,-8.1,-4.5,2.9,b.w/2]:[-11,-4.8,.1,4.6,b.w/2])))box(g,.20,2.83,1.75,x,base+1.54,5.35);
   }else{
    // Parking and common areas: opaque plinth, ventilation and service doors.
    const entryX=b.w/2-1.6,entryFloor=b.id===3&&f===first-1;
    const garage=false;
    const openings:Opening[]=b.id===2?[]:b.id===3?(entryFloor?[{x:entryX,w:1.9,sill:0,h:2.5}]:[]):entryFloor?[{x:entryX,w:1.9,sill:0,h:2.5},...(garage?[{x:entryX-3.45,w:4.0,sill:0,h:2.5}]:[]),{x:-b.w*.3,w:2.4,sill:1.8,h:.6}]:[-b.w*.3,0,b.w*.3].map(x=>({x,w:2.4,sill:1.8,h:.6}));
    facade(g,b.w,2.83,base+.12,0,4.5,0,openings);
    if(garage){
     // Common vehicle portal next to the entrance indicated in the October sketch.
     const x=entryX-3.45;
     box(g,4,2.45,.08,x,base+1.25,4.62,'graphite');
     for(let i=0;i<15;i++)box(g,3.96,.025,.025,x,base+.12+i*.16,4.68,'stone');
     box(g,4.4,.16,2.3,x,base+.02,5.5,'stone');counts.garagePortals++;
    }
    if(entryFloor){
     const entry=new T.Group();entry.position.x=entryX;g.add(entry);counts.frontEntrances.push({x:b.x+entryX,y:base});
     // Recessed communal entrance: white portal, dark door, horizontal glazing and intercom.
     // Appearance follows the supplied perspective; dimensions remain illustrative.
     box(entry,2.5,.22,1.8,0,base+2.68,5.25);
     for(const side of [-1,1])box(entry,.23,2.55,1.65,side*1.12,base+1.28,5.2);
     box(entry,1.76,2.35,.06,0,base+1.23,4.65,'graphite');
     box(entry,1.42,.50,.025,0,base+1.65,4.69,'glass');
     for(const y of [base+1.38,base+1.92])box(entry,1.5,.055,.045,0,y,4.72);
     box(entry,.035,.58,.08,.62,base+1.12,4.76,'stone');
     box(entry,.18,.32,.05,1.13,base+1.4,6.04,'graphite');
     box(entry,.10,.065,.012,1.13,base+1.46,6.075,'glass');
     box(entry,3.4,.12,2.8,0,base+.06,5.8,'stone');
     // Low white returns frame the approach while leaving the door route open.
     for(const side of [-1,1])box(entry,.18,.85,2.4,side*1.65,base+.49,5.85);
    }
    if(b.id!==3&&b.id!==2)for(const x of (entryFloor?[-b.w*.3]:[-b.w*.3,0,b.w*.3]))for(let j=0;j<6;j++)box(g,2.36,.035,.12,x,base+1.94+j*.095,4.6,'graphite');
   }
   // Outer gables, with wraparound balconies at the eastern end in the source video.
   for(const side of [-1,1]){
    const outer=(b.id===1&&side===1)||(b.id===3&&side===-1);
    const west=outer&&b.id===3&&f>=first;
    const opening:Opening[]=outer&&f>=first?(west?
     [{x:-4.65,w:2.15,sill:.16,h:2.34,panes:2},{x:-1.10,w:3.65,sill:.16,h:2.34,panes:3},{x:3.5,w:2.0,sill:2.05,h:.40,panes:1}]:
     f===0?[{x:2.0,w:5.1,sill:.16,h:2.34,panes:4}]:
     (f===2?[-4.5,-.25,4]:[-3.5,-.45,4]).map(x=>({x,w:2.15,sill:.16,h:2.34,panes:2}))):[];
    // The penthouse side wall belongs at x=4.4, not at the outer terrace edge x=11.
    const sideX=penthouse&&side===1?4.4:side*(b.w/2-.12)+(west?1.4:0);
    facade(g,12.5,2.83,base+.12,sideX,0,side===1?-Math.PI/2:Math.PI/2,opening);counts.sideWindows+=opening.length;
    if(west){
     box(g,1.55,.22,7.2,-b.w/2+.65,base,2.8);
     rail(g,7.2,-b.w/2-.02,base+.2,2.8,Math.PI/2);
     for(const z of [-.8,6.4])box(g,1.55,2.83,.20,-b.w/2+.65,base+1.535,z);
     counts.sideBalconies++;counts.balconyEndWalls+=2;
    }
    if(b.id===1&&side===1){box(g,1.75,.22,12.9,b.w/2+.75,base,0);rail(g,12.9,b.w/2+1.55,base+.2,0,Math.PI/2);// Full-height white returns close both ends of each side balcony.
     for(const end of [-1,1]){box(g,1.85,2.83,.22,b.w/2+.78,base+1.535,end*6.4);counts.balconyEndWalls++;}
     counts.sideBalconies++;}
   }
   const rear=f>=first?[-b.w*.35,-b.w*.16,b.w*.2,b.w*.39].map((x,i)=>({x,w:i%2?2.4:1.6,sill:.92,h:1.45})):[];
   facade(g,width,2.83,base+.12,center,-6.2,Math.PI,penthouse?[]:rear);counts.rearWindows+=rear.length;
  }
  const top=b.levels*3.05;
  const roofWidth=b.id===2?15.4:b.w,roofCenter=b.id===2?-3.3:0;
  box(g,roofWidth,.48,.23,roofCenter,top+.25,-6.4);for(const side of [-1,1])box(g,.23,.48,13,roofCenter+side*roofWidth/2,top+.25,0);
  // Projecting stair and lift core visible on the six general plans.
  const core=new T.Group();core.position.z=-7.9;g.add(core);counts.stairCores++;
  const entryLevel=b.id===1?0:b.id===2?1:2;const e=entryLevel*3.05;
  // The two tall roof projections marked for removal: keep the stair core below its roof.
  const coreTop=b.id===1?top+1:top-.18;
  facade(core,3.8,coreTop,0,0,-1.65,Math.PI,[{x:0,w:2.25,sill:e+.1,h:2.45}]);
  for(const side of [-1,1])facade(core,3.4,coreTop,0,side*1.85,0,Math.PI/2,[{x:0,w:1.15,sill:.45,h:coreTop-.60}]);
  box(core,4.1,.18,3.7,0,coreTop+.09,0);if(b.id===1)box(core,2.2,top+.65,2.3,3,top/2+.325,.15);
  for(let f=0;f<b.levels;f++){
   box(core,3.5,.16,1.25,0,f*3.05+.2,-.7,'stone');
   for(let i=0;i<9;i++)box(core,1.35,.16,.25,-.8,f*3.05+i*.17+.2,.8-i*.23,'stone');
  }
  // Rear external flights, approach bridges and railings removed at the owner's request.
  // The internal stair/lift cores and their doors remain part of the building.
  box(g,2.25,2.45,.16,0,e+1.3,-9.65,'graphite');box(g,1.95,2.18,.04,0,e+1.3,-9.75,'glass');
  box(g,.05,2.2,.08,0,e+1.3,-9.8,'graphite');box(g,.035,.5,.09,.18,e+1.25,-9.83,'graphite');
  box(g,3.1,.15,1.3,0,e+2.6,-10.1);
  for(const side of [-1,1]){
   // Rainwater pipes follow the façade corners.
   const pipe=new T.Mesh(new T.CylinderGeometry(.045,.045,top,8),m.graphite);pipe.position.set(side*(b.w/2-.3),top/2,-6.4);g.add(pipe);
   for(let f=0;f<b.levels;f++)box(g,.13,.06,.13,side*(b.w/2-.3),f*3.05+.7,-6.4,'graphite');
  }
  // Ventilation terminals are visible on the animation; exact services are not supplied.
  for(const x of (b.id===2?[-6,1]:[-b.w*.3,b.w*.3])){box(g,.62,.55,.62,x,top+.4,-3.9,'concrete');box(g,.85,.09,.85,x,top+.73,-3.9,'graphite');}
 }
 // Basement -1: curved vehicle approach is at the east end (PRE.AX.01).
 box(structure,65,.22,13,-.5,-3.05,0,'concrete');
 box(structure,65,2.8,.3,-.5,-1.55,6.4,'stone');
 box(structure,.3,2.8,3.7,33,-1.55,-4.45,'concrete');box(structure,.3,2.8,3.7,33,-1.55,4.45,'concrete');
 box(structure,.5,.4,5.1,33,-.25,0,'concrete');
 box(structure,.2,2.4,4.7,31.8,-1.6,0,'graphite');
 for(let j=0;j<13;j++)box(structure,.24,.035,4.55,31.92,-2.75+j*.18,0,'concrete');
 box(structure,.12,.45,.36,33.3,-1.35,2.7,'graphite');counts.garagePortals++;
 // Waste room beside garage access in the -1 plan, with its own service door.
 box(structure,3.3,2.6,.24,34.65,-1.65,5.1);box(structure,.24,2.6,2.5,36.2,-1.65,3.9);
 box(structure,3.5,.22,2.8,34.65,-.3,3.9);box(structure,1.3,2.1,.12,34.6,-1.87,5.25,'graphite');
 // Sloped apron with a curved retaining edge; base height is consistent with P-1.
 const points=[new T.Vector3(33,-2.94,0),new T.Vector3(39,-3.02,0),new T.Vector3(43,-3.15,5),new T.Vector3(43,-3.35,13),new T.Vector3(43,-3.48,22)];
 const curve=new T.CatmullRomCurve3(points),verts:number[]=[],uv:number[]=[];
 for(let i=0;i<48;i++){
  const a=curve.getPoint(i/48),b=curve.getPoint((i+1)/48),ta=curve.getTangent(i/48),tb=curve.getTangent((i+1)/48);
  const n=new T.Vector3(-ta.z,0,ta.x).multiplyScalar(2.5),q=new T.Vector3(-tb.z,0,tb.x).multiplyScalar(2.5);
  const corners=[a.clone().sub(n),b.clone().add(q),b.clone().sub(q),a.clone().sub(n),a.clone().add(n),b.clone().add(q)];
  for(const p of corners){verts.push(p.x,p.y,p.z);uv.push(p.x/3,p.z/3);}
  if(i<40){const v=a.clone().add(n),next=b.clone().add(q),len=v.distanceTo(next);const wall=box(structure,.22,2.7,len+.04,(v.x+next.x)/2,(v.y+next.y)/2+1.3,(v.z+next.z)/2);if(wall)wall.rotation.y=Math.atan2(next.x-v.x,next.z-v.z);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(Array.from({length:verts.length/3},(_,i)=>i));geo.computeVertexNormals();const apron=new T.Mesh(geo,m.concrete);apron.receiveShadow=true;structure.add(apron);
 box(structure,9,.12,10,37.5,-3.1,3.5,'concrete');
 // Drain channel at the portal threshold.
 for(let i=0;i<24;i++)box(structure,.38,.025,.065,33.5,-2.91,-2.3+i*.2,'graphite');
 return counts;
}
