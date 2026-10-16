import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {planTransform,pointInPolygon,type Point} from './navigation';
import type {ApartmentPlan} from './architecture-scene';
import type {DoorPlan} from './doors';

// Double rockers in matte black, based on the supplied product photograph.
// Heights and locations are illustrative: no electrical installation plan was supplied.
export function makeLightSwitches(plan:ApartmentPlan,useful:number,doors:DoorPlan[]){
 const root=new T.Group();root.name='matte-black-light-switches';
 const {cx,cy,scale}=planTransform(plan,useful);
 const world=(p:number[]):Point=>[(p[0]-cx)*scale,(p[1]-cy)*scale];
 const walls=plan.walls.map(poly=>poly.map(world)),outline=plan.outline.map(world);
 const free=(p:Point)=>pointInPolygon(p,outline)&&!walls.some(poly=>pointInPolygon(p,poly));
 const placements:{position:Point;normal:Point;height:number}[]=[];
 const geometries:T.BufferGeometry[]=[];
 for(const door of doors){
  const a=world(door.a),b=world(door.b),length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.1)continue;
  const dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length;
  const target:Point=[b[0]+dx*.20,b[1]+dz*.20];
  const candidates:{position:Point;normal:Point;distance:number}[]=[];
  for(const poly of walls)for(let i=0;i<poly.length;i++){
   const p=poly[i],q=poly[(i+1)%poly.length],ex=q[0]-p[0],ez=q[1]-p[1],len=Math.hypot(ex,ez);
   if(len<.12||Math.abs((ex*dx+ez*dz)/len)<.85)continue;
   const t=T.MathUtils.clamp(((target[0]-p[0])*ex+(target[1]-p[1])*ez)/(len*len),.055/len,1-.055/len);
   const surface:Point=[p[0]+ex*t,p[1]+ez*t],distance=Math.hypot(surface[0]-target[0],surface[1]-target[1]);
   if(distance>.5)continue;
   for(const sign of [-1,1]){
    const normal:Point=[-ez/len*sign,ex/len*sign],position:Point=[surface[0]+normal[0]*.006,surface[1]+normal[1]*.006];
    if(!free([surface[0]+normal[0]*.04,surface[1]+normal[1]*.04]))continue;
    if(!walls.some(w=>pointInPolygon([position[0]-normal[0]*.02,position[1]-normal[1]*.02],w)))continue;
    candidates.push({position,normal,distance});
   }
  }
  for(const side of [-1,1]){
   const candidate=candidates.filter(c=>(-dz*c.normal[0]+dx*c.normal[1])*side>.8).sort((x,y)=>x.distance-y.distance)[0];
   if(!candidate||placements.some(p=>Math.hypot(p.position[0]-candidate.position[0],p.position[1]-candidate.position[1])<.10))continue;
   const {position,normal}=candidate;placements.push({position,normal,height:1.10});
   const matrix=new T.Matrix4().compose(new T.Vector3(position[0],1.10,position[1]),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(normal[0],normal[1])),new T.Vector3(1,1,1));
   const add=(w:number,h:number,d:number,x:number,z:number,r:number)=>{const g=new RoundedBoxGeometry(w,h,d,1,r);g.translate(x,0,z);g.applyMatrix4(matrix);geometries.push(g)};
   add(.086,.086,.008,0,0,.003);
   for(const side of [-1,1])add(.030,.057,.006,side*.016,.006,.0015);
  }
 }
 if(geometries.length){const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(geometry){const material=new T.MeshStandardMaterial({color:'#181a1c',roughness:.74,metalness:0});material.name='Switch matte black — photo reference';material.userData.authoredPBR=true;const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh)}}
 root.userData.placements=placements;root.userData.switchCount=placements.length;
 return root;
}
