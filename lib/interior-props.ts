import wardrobePlan from '../data/built-in-wardrobes.json';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {ApartmentPlan} from './architecture-scene';
import type {DoorPlan} from './doors';
import {bathroomZones} from './finish-zones';
import {buildNavigation,pointInPolygon,segmentDistance,type Point} from './navigation';

type Obstacle={points:number[][];fixed:boolean};
// Normalized sanitary anchors read from the symbols on the supplied sheets.
// x/y are within each finish zone; angle is the direction facing into the room.
type BathroomLayout={wc:[number,number,number];basin:[number,number,number];shower:[number,number,number,number]};
const leftBasin:BathroomLayout={wc:[.52,.17,0],basin:[.14,.50,Math.PI/2],shower:[.5,.85,.91,.27]};
const rightBasin:BathroomLayout={wc:[.4,.17,0],basin:[.86,.50,-Math.PI/2],shower:[.5,.85,.91,.27]};
const showerLeft:BathroomLayout={wc:[.75,.17,0],basin:[.77,.86,Math.PI],shower:[.22,.23,.42,.42]};
const showerRight:BathroomLayout={wc:[.28,.17,0],basin:[.23,.86,Math.PI],shower:[.78,.23,.42,.42]};
const layouts:Record<string,BathroomLayout[]>={
 A:[{wc:[.84,.27,-Math.PI/2],basin:[.14,.27,Math.PI/2],shower:[.77,.79,.43,.4]},{wc:[.14,.60,Math.PI/2],basin:[.52,.14,0],shower:[.85,.5,.27,.92]}],
 B:[leftBasin,{wc:[.17,.68,Math.PI/2],basin:[.73,.14,0],shower:[.23,.23,.44,.43]}],
 C:[rightBasin,showerRight],H:[leftBasin,showerLeft],
 I:[{wc:[.72,.17,0],basin:[.14,.70,Math.PI/2],shower:[.22,.23,.41,.43]},leftBasin],
 J:[leftBasin,showerLeft],L:[rightBasin,showerRight],
 O:[{wc:[.26,.17,0],basin:[.13,.72,Math.PI/2],shower:[.76,.23,.45,.43]},{wc:[.85,.73,-Math.PI/2],basin:[.21,.13,0],shower:[.76,.23,.45,.43]}],
 P:[{wc:[.76,.84,Math.PI],basin:[.86,.23,-Math.PI/2],shower:[.23,.62,.42,.67]},{wc:[.51,.77,Math.PI],basin:[.82,.14,0],shower:[.3,.23,.45,.43]}],
 Q:[{wc:[.83,.25,-Math.PI/2],basin:[.23,.13,0],shower:[.77,.79,.43,.4]},{wc:[.47,.16,0],basin:[.85,.63,-Math.PI/2],shower:[.22,.52,.39,.86]}],
};
for(const [id,base] of Object.entries({D:'B',F:'B',E:'C',G:'C',M:'J',N:'L',R:'P',T:'P',S:'Q',U:'Q'}))layouts[id]=layouts[base];

export function makeInteriorProps(plan:ApartmentPlan,useful:number,unitId:string,doors:DoorPlan[]=[]){
 const fixed=new T.Group(),decor=new T.Group(),obstacles:Obstacle[]=[],counts:Record<string,number>={},focus:Record<string,T.Vector3>={};fixed.name='fixed-equipment';decor.name='decorative-props';
 const nav=buildNavigation(plan,useful),world=nav.world;
 const white=new T.MeshPhysicalMaterial({color:'#f3f1e9',roughness:.35,clearcoat:.3,clearcoatRoughness:.3});
 const black=new T.MeshStandardMaterial({color:'#151a1a',roughness:.67,metalness:.12});
 const ceramic=new T.MeshPhysicalMaterial({color:'#fafaf5',roughness:.17,clearcoat:.65});
 const resin=new T.MeshStandardMaterial({color:'#eeeae3',roughness:.67});
 const mirror=new T.MeshStandardMaterial({color:'#bdc9ca',metalness:1,roughness:.1});
 const glass=new T.MeshPhysicalMaterial({color:'#d9e5e5',transparent:true,opacity:.16,roughness:.08,metalness:.03,depthWrite:false,side:T.DoubleSide});
 const cloth=new T.MeshStandardMaterial({color:'#c3b49c',roughness:.99});
 const pages=new T.MeshStandardMaterial({color:'#e4ded1',roughness:.85});
 const wood=new T.MeshStandardMaterial({color:'#d3c0a5',roughness:.61});wood.userData.finish='oak';
 const led=new T.MeshStandardMaterial({color:'#f9e6bd',emissive:'#f5d391',emissiveIntensity:.8});
 const screen=new T.MeshPhysicalMaterial({color:'#141b22',roughness:.13,metalness:.2,clearcoat:1,clearcoatRoughness:.12});
 function count(name:string){counts[name]=(counts[name]||0)+1}
 function mesh(g:T.Object3D,geo:T.BufferGeometry,mat:T.Material,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=mat!==glass&&mat!==led;m.receiveShadow=true;g.add(m);return m}
 function box(g:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material,r=.012){return mesh(g,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)),mat,x,y,z)}
 function cylinder(g:T.Object3D,r:number,h:number,x:number,y:number,z:number,mat:T.Material){return mesh(g,new T.CylinderGeometry(r,r,h,20),mat,x,y,z)}
 function tube(g:T.Object3D,points:number[][],r:number,mat:T.Material){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,6,false),mat)}
 function footprint(g:T.Group,w:number,d:number,stationary:boolean){g.updateWorldMatrix(true,false);const points=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>{const p=g.localToWorld(new T.Vector3(x,0,z));return [p.x,p.z]});obstacles.push({points,fixed:stationary})}
 const clearProps=(p:Point,furnished=true,radius=.16)=>obstacles.every(o=>!o.fixed&&!furnished||!pointInPolygon(p,o.points)&&o.points.every((a,i)=>segmentDistance(p,a,o.points[(i+1)%o.points.length])>radius));
 function tap(g:T.Object3D,x:number,y:number,z:number){cylinder(g,.016,.25,x,y+.125,z,black);tube(g,[[x,y+.25,z],[x,y+.3,z+.055],[x,y+.28,z+.12],[x,y+.23,z+.12]],.015,black);box(g,.018,.055,.085,x+.034,y+.20,z,black,.003)}
 for(const [index,zone] of (bathroomZones[unitId]||[]).entries()){
  const a=world(zone[0]),b=world(zone[1]),c=world(zone[3]),w=Math.hypot(b[0]-a[0],b[1]-a[1]),d=Math.hypot(c[0]-a[0],c[1]-a[1]),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  const room=new T.Group();room.name=`sanitary-${index+1}`;room.position.set(a[0],0,a[1]);room.rotation.y=angle;fixed.add(room);
  const layout=layouts[unitId]?.[index]||leftBasin;
  const item=(p:[number,number,number])=>{const g=new T.Group();g.position.set(p[0]*w,0,p[1]*d);g.rotation.y=p[2];room.add(g);return g};
  const wc=item(layout.wc),ww=Math.min(.37,w*.24),wd=Math.min(.55,d*.28);
  // Suspended bowl, inner recess, seat ring and separate matte-black flush plate.
  box(wc,ww,.25,wd,0,.31,0,ceramic,.11);const hollow=cylinder(wc,ww*.31,.005,0,.44,0,resin);hollow.scale.z=wd/ww*.8;
  const seatShape=new T.Shape(),sw=ww*.51,sd=wd*.46;
  seatShape.absellipse(0,0,sw,sd,0,Math.PI*2,false,0);const hole=new T.Path();hole.absellipse(0,0,sw*.66,sd*.70,0,Math.PI*2,true,0);seatShape.holes.push(hole);
  const seatGeo=new T.ExtrudeGeometry(seatShape,{depth:.025,bevelEnabled:true,bevelThickness:.009,bevelSize:.008,bevelSegments:2,steps:1,curveSegments:24});seatGeo.rotateX(-Math.PI/2);mesh(wc,seatGeo,ceramic,0,.451,0);
  box(wc,.23,.15,.015,0,1.03,-wd/2,black);for(const x of [-.047,.052]){const disc=cylinder(wc,x<0?.036:.025,.005,x,1.03,-wd/2+.013,black);disc.rotation.x=Math.PI/2}
  tube(wc,[[ww*.7,.72,-wd*.35],[ww*.8,.28,-wd*.1],[ww*.85,.50,wd*.1]],.008,black);box(wc,.035,.12,.035,ww*.85,.57,wd*.1,black);footprint(wc,ww,wd,true);count('suspended-toilet');
  const vanity=item(layout.basin),vw=Math.min(.65,w*.34),vd=Math.min(.42,d*.25);
  box(vanity,vw,.30,vd,0,.56,0,white,.02);box(vanity,vw+.025,.045,vd+.02,0,.745,0,white);box(vanity,vw*.58,.012,.015,0,.62,vd/2+.01,black,.003);
  // Revolved open vessel: inner wall and outer wall form a genuine bowl cavity.
  const radius=Math.min(vw*.32,vd*.40),profile=[[0,0],[radius*.73,0],[radius,.12],[radius*.94,.145],[radius*.81,.12],[radius*.59,.028],[0,.028]].map(([x,y])=>new T.Vector2(x,y));
  const bowl=mesh(vanity,new T.LatheGeometry(profile,32),ceramic,0,.773,.025);bowl.scale.x=1.25;cylinder(vanity,.017,.004,0,.804,.025,black);tap(vanity,0,.79,-vd*.38);
  box(vanity,vw*.96,.76,.025,0,1.42,-vd*.48,black,.04);box(vanity,vw*.92,.72,.012,0,1.42,-vd*.45,mirror,.04);box(vanity,vw*.84,.01,.012,0,1.795,-vd*.46,led);
  cylinder(vanity,.027,.10,vw*.38,.82,vd*.2,black);box(vanity,.045,.012,.02,vw*.38,.881,vd*.21,black);footprint(vanity,vw,vd,true);count('vessel-basin');focus[`Casa de banho ${index+1}`]=vanity.localToWorld(new T.Vector3(0,.98,0));
  const [sx,sy,rw,rd]=layout.shower,shower=item([sx,sy,0]),tw=w*rw,td=d*rd;
  box(shower,tw,.034,td,0,.018,0,resin,.008);box(shower,tw*.42,.006,.025,0,.037,-td*.30,black,.002);
  // A clear fixed screen leaves the side facing circulation open.
  box(shower,.008,1.95,td*.83,-tw/2+.012,1.01,0,glass,.001);box(shower,.02,.02,td*.84,-tw/2+.012,1.985,0,black,.002);
  const screenObstacle=new T.Group();screenObstacle.position.x=-tw/2+.012;shower.add(screenObstacle);footprint(screenObstacle,.014,td*.83,true);
  tube(shower,[[0,.85,-td*.40],[0,2.02,-td*.40],[0,2.10,-td*.23],[0,2.10,0]],.014,black);
  cylinder(shower,.11,.025,0,2.08,0,black);box(shower,.20,.045,.06,0,.97,-td*.39,black);count('shower');
  // Folded towels on an open shelf below the vanity, clear of the vessel basin.
  box(vanity,vw*.90,.025,vd*.85,0,.32,0,white);
  for(let n=0;n<2;n++)box(vanity,vw*.55,.035,vd*.62,0,.354+n*.039,0,cloth,.012);count('towel-stack');
 }
 // Fitted cabinets traced from the user's orange annotations, in each source sheet coordinates.
 const fitted=(wardrobePlan.units as Record<string,{x:number;y:number;w:number;d:number;rotation:number}[]>)[unitId]||[];
 for(const r of fitted){
  const g=new T.Group();g.name='built-in-wardrobe';const p=world([r.x,r.y]);g.position.set(p[0],0,p[1]);g.rotation.y=-r.rotation*Math.PI/180;
  let w=r.w*nav.scale,d=r.d*nav.scale;if(d>w){[w,d]=[d,w];g.rotation.y+=Math.PI/2}
  fixed.add(g);const h=2.65;
  // Simple bevel-free carcasses keep the fixed cabinetry inexpensive to render.
  const panel=(ww:number,hh:number,dd:number,x:number,y:number,z:number,mat:T.Material)=>mesh(g,new T.BoxGeometry(ww,hh,dd),mat,x,y,z);
  panel(w,h-.02,d,0,h/2-.01,0,white);panel(w-.04,.08,.025,0,.04,d/2+.006,black);
  const n=Math.max(2,Math.ceil(w/.62)),leaf=w/n;
  for(let i=0;i<n;i++){const x=-w/2+(i+.5)*leaf;panel(leaf-.009,h-.11,.018,x,(h+.07)/2,d/2+.009,white);panel(.009,.36,.006,x+leaf*.36,1.18,d/2+.021,black);}
  footprint(g,w,d+.04,true);count('wardrobe');
  const nearest=plan.rooms.filter(q=>/Quarto|Suíte/.test(q.label)).sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0];if(nearest&&!focus[nearest.label])focus[nearest.label]=g.localToWorld(new T.Vector3(0,1.35,0));
 }
 for(const room of plan.rooms.filter(r=>/Quarto|Suíte/.test(r.label))){
  const source=world([room.x,room.y]);
  const door=doors.map(d=>({d,p:world([(d.a[0]+d.b[0])/2,(d.a[1]+d.b[1])/2])})).sort((a,b)=>Math.hypot(a.p[0]-source[0],a.p[1]-source[1])-Math.hypot(b.p[0]-source[0],b.p[1]-source[1]))[0];
  if(door&&Math.hypot(door.p[0]-source[0],door.p[1]-source[1])<4){const a=world(door.d.a),b=world(door.d.b),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);let nx=-dz/len,nz=dx/len;if(nx*(source[0]-door.p[0])+nz*(source[1]-door.p[1])<0){nx=-nx;nz=-nz}const g=new T.Group();g.position.set(door.p[0]+nx*.16,0,door.p[1]+nz*.16);g.rotation.y=Math.atan2(nx,nz);fixed.add(g);box(g,.78,.24,.17,0,2.39,0,white,.035);box(g,.66,.028,.018,0,2.315,.086,black);for(let i=0;i<9;i++)box(g,.0015,.04,.006,-.28+i*.07,2.35,.09,resin,.0003);count('air-conditioning');}
 }
 // Ceiling air terminals: service positions are illustrative, not an MEP layout.
 for(const room of plan.rooms.filter(r=>/Sala|Quarto|Suíte/.test(r.label))){const p=world([room.x,room.y]);const g=new T.Group();g.position.set(p[0],0,p[1]);fixed.add(g);cylinder(g,.095,.012,0,2.64,0,white);for(const r of [.047,.067,.085]){const ring=mesh(g,new T.TorusGeometry(r,.003,4,24),resin,0,2.629,0);ring.rotation.x=Math.PI/2}count('ventilation');}
 return {fixed,decor,counts,obstacles,focus,clear:clearProps};
}

