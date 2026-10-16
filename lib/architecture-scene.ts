import * as T from 'three';
import {detailExterior,buildingBlocks} from './exterior-detail';
import {makeInteriorProps} from './interior-props';
import type {DoorPlan} from './doors';
import {bathroomZones} from './finish-zones';
import {spcFloor,spcWall,finishWalls} from './spc-finishes';
import {planTransform} from './navigation';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {Unit} from './catalog';
export type ApartmentPlan={outline:number[][];walls:number[][][];furniture:{type:string;x:number;y:number;w:number;d:number;rotation?:number}[];rooms:{label:string;x:number;y:number}[];source:string};
export type InteriorData={units:Record<string,ApartmentPlan>};
export const materials={
 plaster:new T.MeshStandardMaterial({color:'#faf9f5',roughness:.83}),
 concrete:new T.MeshStandardMaterial({color:'#d7d4cc',roughness:.95}),
 graphite:new T.MeshStandardMaterial({color:'#303637',roughness:.52,metalness:.32}),
 glass:new T.MeshPhysicalMaterial({color:'#c4d9e2',metalness:.12,roughness:.09,transparent:true,opacity:.43,envMapIntensity:1.4,clearcoat:1}),
 oak:new T.MeshStandardMaterial({color:'#bd9770',roughness:.7}),
 beige:new T.MeshStandardMaterial({color:'#c9bfae',roughness:.67}),
 fabric:new T.MeshStandardMaterial({color:'#dad4c8',roughness:1}),
 linen:new T.MeshStandardMaterial({color:'#f2eee6',roughness:1}),
 green:new T.MeshStandardMaterial({color:'#4b5e42',roughness:1}),
 stone:new T.MeshStandardMaterial({color:'#e9e4d8',roughness:.55})
};
type Mat=keyof typeof materials;
function box(parent:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:Mat='plaster'){
 const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),materials[mat]);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function mergeStatic(group:T.Group){group.updateMatrixWorld(true);const sets=new Map<T.Material,T.BufferGeometry[]>();group.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.Material;const arr=sets.get(m)||[];const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);arr.push(g);sets.set(m,arr);o.geometry.dispose()}});group.clear();for(const [m,geos] of sets){const merged=mergeGeometries(geos);geos.forEach(g=>g.dispose());if(merged){const mesh=new T.Mesh(merged,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}}}
export function makeBuilding(units:Unit[]){
 const root=new T.Group(),structure=new T.Group(),picks:T.Mesh[]=[],anchors:Record<string,T.Vector3>={};root.add(structure);
 // Exterior restored to its original white finish at the owner's request.
 const exteriorPlaster=materials.plaster.clone();exteriorPlaster.color.set('#faf9f5');exteriorPlaster.name='exterior-white-plaster';
 const blocks=buildingBlocks;const details=detailExterior(structure,{...materials,plaster:exteriorPlaster});root.userData.exteriorDetails=details;
 // The apartment IDs and floor positions come from the source catalogue.
 for(const u of units){const b=blocks.find(b=>b.id===u.building)!;const same=units.filter(v=>v.building===u.building&&v.floor===u.floor);const left=['C','E','G','I','L','N','Q','S','U'].includes(u.id);const width=same.length===1?b.w:b.w/2;const localX=same.length===1?0:(left?-1:1)*b.w/4;const p=new T.Vector3(localX,u.floor*3.05+1.5,5.7);p.x+=b.x;p.z+=b.z;anchors[u.id]=p.clone().add(new T.Vector3(0,.2,1));const mesh=new T.Mesh(new T.BoxGeometry(width-.1,2.6,1.65),new T.MeshBasicMaterial({color:'#648c6d',transparent:true,opacity:0,depthWrite:false}));mesh.position.copy(p);mesh.userData={unit:u.id,floor:u.floor};root.add(mesh);picks.push(mesh)}
 mergeStatic(structure);return {root,picks,anchors};
}
export function makeInterior(plan:ApartmentPlan,useful?:number,unitId?:string,doors:DoorPlan[]=[] ){
 const root=new T.Group();const {scale,cx,cy}=planTransform(plan,useful);
 const point=(p:number[])=>new T.Vector2((p[0]-cx)*scale,-(p[1]-cy)*scale);
 function poly(points:number[][],height:number,mat:T.Material){const shape=new T.Shape(points.map(point));const geo=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geo.rotateX(-Math.PI/2);const mesh=new T.Mesh(geo,mat);mesh.receiveShadow=true;mesh.castShadow=true;return mesh}
 const oak=spcFloor();const texture=new T.Texture();
 const floor=poly(plan.outline,.12,oak);floor.name='floor';const floorPos=floor.geometry.getAttribute('position'),floorUv=floor.geometry.getAttribute('uv');for(let i=0;i<floorPos.count;i++)floorUv.setXY(i,floorPos.getX(i),-floorPos.getZ(i));floor.position.y=-.12;root.add(floor);
 const geometries:T.BufferGeometry[]=[];for(const points of plan.walls){if(points.length<3)continue;const wall=poly(points,2.65,materials.plaster);geometries.push(wall.geometry)}if(geometries.length){const geo=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(geo){finishWalls(geo,bathroomZones[unitId||'']||[],scale,cx,cy);const walls=new T.Mesh(geo,[materials.plaster,spcWall()]);walls.name='walls';walls.castShadow=true;walls.receiveShadow=true;root.add(walls)}}
 const ceiling=poly(plan.outline,.08,materials.plaster);ceiling.name='ceiling';ceiling.position.y=2.66;ceiling.visible=false;root.add(ceiling);
 materials.oak.userData.finish='oak';materials.stone.userData.finish='stone';
 const furnishings=new T.Group();furnishings.name='furnishings';root.add(furnishings);
 // All styling below is illustrative. Geometry stays inside the furniture footprints
 // recorded from the source sheets, so decorative additions do not occupy circulation.
 const upholstery=new T.MeshPhysicalMaterial({color:'#b9ad96',roughness:.94,sheen:.7,sheenColor:'#d8cbbb',sheenRoughness:.8});
 const throwFabric=new T.MeshPhysicalMaterial({color:'#737d68',roughness:.98,sheen:.7,sheenColor:'#b9c5ae',sheenRoughness:.9});
 const brass=new T.MeshStandardMaterial({color:'#877451',roughness:.34,metalness:.78});
 const ceramic=new T.MeshStandardMaterial({color:'#e8dfce',roughness:.34});
 const glow=new T.MeshStandardMaterial({color:'#fff1d6',roughness:.85,emissive:'#ffe0ad',emissiveIntensity:.24});
 function soft(parent:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material,r=.05){const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 function cylinder(parent:T.Object3D,rt:number,rb:number,h:number,x:number,y:number,z:number,mat:T.Material){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,16),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 for(const f of (plan.furniture||[]).filter(f=>f.type==='kitchen')){const g=new T.Group();g.name=f.type;g.position.set((f.x-cx)*scale,0,(f.y-cy)*scale);g.rotation.y=-(f.rotation||0)*Math.PI/180;furnishings.add(g);let w=f.w*scale,d=f.d*scale;
  if((f.type==='bed'&&w>d)||((f.type==='kitchen'||f.type==='sofa')&&d>w)){[w,d]=[d,w];g.rotation.y+=Math.PI/2}
  if(f.type==='kitchen'){
   // Appliances and small accessories are illustrative staging, not a sales specification.
   const ovenW=Math.min(.58,w*.24),ovenX=-w*.25;
   soft(g,ovenW,.44,.022,ovenX,.45,d*.49,materials.graphite,.012);
   soft(g,ovenW*.84,.28,.012,ovenX,.42,d*.51,materials.glass,.008);
   box(g,ovenW*.70,.022,.045,ovenX,.645,d*.53,'graphite');
   for(const dx of [-1,1]){const knob=cylinder(g,.022,.022,.018,ovenX+dx*ovenW*.3,.64,d*.52,brass);knob.rotation.x=Math.PI/2}
   box(g,w*.98,.13,d*.84,0,.065,-d*.03,'graphite');
   box(g,w*.98,.73,d*.94,0,.495,0,'beige');
   soft(g,w,.045,d,0,.884,0,materials.stone,.01);
   const count=Math.max(2,Math.round(w/.62)),cw=w*.98/count;
   for(let c=0;c<count;c++){
    const x=-w*.49+(c+.5)*cw;
    soft(g,cw-.015,.70,.018,x,.495,d*.478,materials.beige,.004);
    box(g,cw*.36,.012,.025,x,.75,d*.49,'graphite');
   }
   // Upper beige-matte cabinetry and concealed lighting specified in the MD.
   for(let c=0;c<count;c++){const x=-w*.49+(c+.5)*cw;soft(g,cw-.015,.66,d*.52,x,2.03,-d*.20,materials.beige,.007);box(g,cw*.35,.012,.025,x,1.73,d*.072,'graphite')}
   const strip=new T.Mesh(new T.BoxGeometry(w*.94,.012,.022),glow);strip.position.set(0,1.69,d*.055);g.add(strip);
   // Sink rim and dark basin; the inset is modelled without cutting the counter.
   soft(g,w*.21,.008,d*.58,w*.21,.912,0,brass,.02);
   soft(g,w*.18,.012,d*.49,w*.21,.920,0,materials.graphite,.025);
   const tapX=w*.21,tapZ=-d*.33;
   cylinder(g,.012,.014,.21,tapX,1.02,tapZ,materials.graphite);
   const tap=new T.Mesh(new T.TorusGeometry(.065,.012,6,16,Math.PI),materials.graphite);tap.position.set(tapX,1.125,tapZ+.065);tap.rotation.y=Math.PI/2;g.add(tap);
   cylinder(g,.012,.012,.045,tapX,1.105,tapZ+.13,materials.graphite);
   soft(g,w*.24,.013,d*.65,-w*.25,.912,0,materials.graphite,.012);
   for(const xx of [-1,1])for(const zz of [-1,1]){
    const ring=new T.Mesh(new T.TorusGeometry(Math.min(w*.035,d*.10),.003,4,20),brass);ring.rotation.x=Math.PI/2;ring.position.set(-w*.25+xx*w*.052,.921,zz*d*.16);g.add(ring);
   }
  }

 }
 const props=makeInteriorProps(plan,useful||100,unitId||'',doors);root.add(props.fixed);furnishings.add(props.decor);root.userData.props=props.counts;
 furnishings.traverse(o=>{if(o instanceof T.Mesh&&o.geometry.index){const original=o.geometry;o.geometry=original.toNonIndexed();original.dispose()}});
 mergeStatic(furnishings);props.fixed.traverse(o=>{if(o instanceof T.Mesh&&o.geometry.index){const original=o.geometry;o.geometry=original.toNonIndexed();original.dispose()}});mergeStatic(props.fixed);
 const rooms=(plan.rooms||[]).map(r=>({label:r.label,position:new T.Vector3((r.x-cx)*scale,.1,(r.y-cy)*scale)}));return {root,rooms,texture,oak,props,furnishings};
}
