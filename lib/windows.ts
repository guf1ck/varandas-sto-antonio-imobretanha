import * as T from 'three';
import {planTransform,pointInPolygon,segmentDistance,type Point} from './navigation';
import type {ApartmentPlan} from './architecture-scene';
export type WindowPlan={a:Point;b:Point};
export function makeWindows(plan:ApartmentPlan,useful:number,source:WindowPlan[]){
 const root=new T.Group();root.name='glazing';const {cx,cy,scale}=planTransform(plan,useful);
 const anthracite=new T.MeshStandardMaterial({color:'#303539',roughness:.58});const white=new T.MeshStandardMaterial({color:'#f4f2e9',roughness:.46}),black=new T.MeshStandardMaterial({color:'#30363b',roughness:.34,metalness:.45}),glass=new T.MeshPhysicalMaterial({color:'#e8f3fa',roughness:.07,metalness:.05,transparent:true,opacity:.22,envMapIntensity:1.2,side:T.DoubleSide,depthWrite:false});
 function box(parent:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=mat!==glass;m.receiveShadow=true;parent.add(m);return m}
 const edges=source.map(s=>{const a:Point=[(s.a[0]-cx)*scale,(s.a[1]-cy)*scale],b:Point=[(s.b[0]-cx)*scale,(s.b[1]-cy)*scale],w=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);const g=new T.Group();g.position.set((a[0]+b[0])/2,0,(a[1]+b[1])/2);g.rotation.y=angle;root.add(g);
 const sill=w<1.3?.82:.06,head=2.42,h=head-sill;box(g,w+.08,.08,.19,0,sill,0,white);box(g,w+.08,.09,.19,0,head,0,white);for(const x of [-w/2,w/2])box(g,.065,h,.19,x,(head+sill)/2,0,white);const panes=Math.max(2,Math.ceil(w/1.25));for(let i=0;i<panes;i++){const x=-w/2+(i+.5)*w/panes;box(g,w/panes-.055,h-.09,.014,x,(head+sill)/2,0,glass);if(i>0)box(g,.045,h,.09,-w/2+i*w/panes,(head+sill)/2,0,white)}
 box(g,w+.10,.025,.035,0,head-.035,-.105,black);
 // The source defines the opening; sill/head and roller-shutter dimensions are illustrative.
 const mx=(s.a[0]+s.b[0])/2,my=(s.a[1]+s.b[1])/2,dx=(s.b[0]-s.a[0])/Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]),dy=(s.b[1]-s.a[1])/Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]);const inward=pointInPolygon([mx-dy*15,my+dx*15],plan.outline as Point[])?1:-1;
 // Anthracite on the exterior side, white PVC on the interior side (MD p. 5).
 for(const x of [-w/2,w/2])box(g,.06,h,.016,x,(head+sill)/2,-inward*.106,anthracite);for(const y of [sill,head])box(g,w+.06,.064,.016,0,y,-inward*.106,anthracite);
 // Flush white roller-shutter box and side guides; shutter shown fully raised.
 const shutter=box(g,w+.10,.20,.25,0,2.54,inward*.035,white);shutter.name='roller-shutter-box';
 for(const x of [-w/2+.025,w/2-.025]){const guide=box(g,.025,h,.025,x,(head+sill)/2,-inward*.13,anthracite);guide.name='roller-shutter-guide';}

 return {a,b};});return {root,clear:(p:Point)=>edges.every(e=>segmentDistance(p,e.a,e.b)>.18)};
}
