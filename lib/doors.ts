import {makeLightSwitches} from './light-switches';
import * as T from 'three';
import {planTransform,segmentDistance,type Point} from './navigation';
import type {ApartmentPlan} from './architecture-scene';
export type DoorPlan={a:Point;b:Point;open:Point;hinge:'a'};
export function makeDoors(plan:ApartmentPlan,useful:number,source:DoorPlan[]){
 const root=new T.Group();root.name='doors';const {cx,cy,scale}=planTransform(plan,useful);const white=new T.MeshStandardMaterial({color:'#eeeae0',roughness:.62}),black=new T.MeshStandardMaterial({color:'#191d1b',metalness:.12,roughness:.67});const picks:T.Object3D[]=[];
 function box(parent:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 const doors=source.map((d,i)=>{const a:Point=[(d.a[0]-cx)*scale,(d.a[1]-cy)*scale],b:Point=[(d.b[0]-cx)*scale,(d.b[1]-cy)*scale],open:Point=[(d.open[0]-cx)*scale,(d.open[1]-cy)*scale],width=Math.hypot(b[0]-a[0],b[1]-a[1]),closedAngle=-Math.atan2(b[1]-a[1],b[0]-a[0]);let swing=-Math.atan2(open[1]-a[1],open[0]-a[0])-closedAngle;while(swing>Math.PI)swing-=Math.PI*2;while(swing< -Math.PI)swing+=Math.PI*2;
 const frame=new T.Group();frame.position.set(a[0],0,a[1]);frame.rotation.y=closedAngle;root.add(frame);box(frame,.055,2.15,.14,0,1.075,0,white);box(frame,.055,2.15,.14,width,1.075,0,white);box(frame,width+.07,.07,.14,width/2,2.15,0,white);box(frame,width+.03,.47,.10,width/2,2.415,0,white);
 const pivot=new T.Group();pivot.position.set(a[0],0,a[1]);pivot.rotation.y=closedAngle+swing;root.add(pivot);const leaf=box(pivot,Math.max(.1,width-.04),2.08,.042,width/2,1.05,0,white);leaf.userData.door=i;picks.push(leaf);
 for(const z of [-.045,.045]){box(pivot,.035,.18,.015,width*.87,1.01,z,black);box(pivot,.12,.018,.025,width*.87-.045,1.04,z*1.4,black)}
 return {a,width,pivot,closedAngle,swing,open:true};});
 root.add(makeLightSwitches(plan,useful,source));
 return {root,picks,toggle:(i:number)=>{if(doors[i])doors[i].open=!doors[i].open},setAll:(open:boolean)=>doors.forEach(d=>{d.open=open}),update:(delta:number)=>doors.forEach(d=>{const goal=d.closedAngle+(d.open?d.swing:0);d.pivot.rotation.y=T.MathUtils.lerp(d.pivot.rotation.y,goal,1-Math.exp(-delta*8))}),clear:(p:Point)=>doors.every(d=>segmentDistance(p,d.a,[d.a[0]+Math.cos(d.pivot.rotation.y)*d.width,d.a[1]-Math.sin(d.pivot.rotation.y)*d.width])>.17)};
}
