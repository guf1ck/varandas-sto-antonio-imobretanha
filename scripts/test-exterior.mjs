import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {rolldown} from 'rolldown';
import * as T from 'three';
mkdirSync('work',{recursive:true});writeFileSync('work/exterior-entry.ts',"export {makeBuilding} from '../lib/architecture-scene';");
const b=await rolldown({input:'work/exterior-entry.ts',external:id=>id.startsWith('three')});await b.write({file:'work/exterior-check.mjs',format:'esm',codeSplitting:false});await b.close();
const {makeBuilding}=await import('../work/exterior-check.mjs');
const units=JSON.parse(readFileSync('data/units.json'));const model=makeBuilding(units);
assert.equal(model.picks.length,20);assert.equal(Object.keys(model.anchors).length,20);
assert.deepEqual(model.root.userData.exteriorDetails,{sideWindows:19,rearWindows:44,garagePortals:2,stairCores:3,sideBalconies:7,balconyEndWalls:14,flushEndWalls:3,frontEntrances:[{x:15.35,y:0},{x:-12.6,y:3.05}]});
let meshes=0,triangles=0;const structure=model.root.children[0];structure.updateMatrixWorld(true);
structure.traverse(o=>{if(o instanceof T.Mesh){meshes++;assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
assert.ok(meshes>=5&&meshes<=12);assert.ok(triangles<150000);
assert.ok(new T.Box3().setFromObject(structure).min.z>-11,'No rear external staircase, bridge or landing extends behind the cores');
// Entrance recess is physically open at the eastern facade, not drawn on a solid wall.
const ray=new T.Raycaster(new T.Vector3(34,-1.5,0),new T.Vector3(-1,0,0));const hit=ray.intersectObject(structure,true)[0];assert.ok(hit&&hit.distance>1.5&&hit.distance<3,'garage portal remains open before shutter');
// The solid end bay meets the balcony face and has no intervening metal guard.
const flushRay=new T.Raycaster(new T.Vector3(32,5.5,9),new T.Vector3(0,0,-1));
const flushHit=flushRay.intersectObject(structure,true)[0];assert.ok(flushHit&&flushHit.point.z>6.3);
for(const {x,y} of model.root.userData.exteriorDetails.frontEntrances){
 const ray=new T.Raycaster(new T.Vector3(x,y+1,8),new T.Vector3(0,0,-1));
 const hit=ray.intersectObject(structure,true)[0];assert.ok(hit&&hit.point.z<4.8,'Door stays recessed and accessible');
}
// The annotated terrace must be open to the sky, and the east balconies covered.
const terraceRay=new T.Raycaster(new T.Vector3(8,22,2),new T.Vector3(0,-1,0));
const terraceHit=terraceRay.intersectObject(structure,true)[0];assert.ok(terraceHit&&terraceHit.point.y<13,'No roof above terrace');
const eastRoofRay=new T.Raycaster(new T.Vector3(34,22,2),new T.Vector3(0,-1,0));
assert.ok(eastRoofRay.intersectObject(structure,true)[0]?.point.y>12,'East balcony roof present');
const westWallRay=new T.Raycaster(new T.Vector3(-29,10.5,9),new T.Vector3(0,0,-1));
const westHit=westWallRay.intersectObject(structure,true)[0];assert.ok(westHit&&westHit.point.z>6.3,'West wall flush with slab edge');
for(const u of units){assert.equal(model.picks.find(p=>p.userData.unit===u.id).userData.floor,u.floor);assert.ok(Number.isFinite(model.anchors[u.id].y));}
console.log('PASS: exterior openings, garage recess, three cores, 20 selections;',meshes,'meshes;',triangles,'triangles');
