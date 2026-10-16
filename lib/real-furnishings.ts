import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export type FurnitureSlot={type:string;position:T.Vector3;rotation:number;w:number;d:number;fallback:T.Group};
const templates=new Map<string,Promise<T.Group>>();
function load(id:string){if(!templates.has(id)){templates.set(id,new GLTFLoader().loadAsync(`/varandas-sto-antonio-imobretanha/assets/props/${id}/${id}.gltf`).then(g=>g.scene).catch(e=>{templates.delete(id);throw e}))}return templates.get(id)!}
function instance(template:T.Group,w:number,d:number,maxHeight:number){
 const model=template.clone(true);model.traverse(o=>{if(o instanceof T.Mesh){o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.userData.authoredPBR=true;for(const v of Object.values(m))if(v instanceof T.Texture)v.anisotropy=4;}}});
 const b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());const scale=Math.min(w/size.x,d/size.z,maxHeight/size.y);const wrapper=new T.Group();model.position.sub(new T.Vector3(center.x,b.min.y,center.z));wrapper.add(model);wrapper.scale.setScalar(scale);return wrapper;
}
function dispose(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}})}
/** Replace only once a complete, textured arrangement is ready. Fallback stays usable on failure. */
export function upgradeFurnishings(parent:T.Group,slots:FurnitureSlot[]){
 let cancelled=false;const loaded:T.Group[]=[];
 async function prepare(slot:FurnitureSlot){
  const {w,d}=slot,arrangement=new T.Group();arrangement.name='textured-'+slot.type;arrangement.position.copy(slot.position);arrangement.rotation.y=slot.rotation;
  try{
   if(slot.type==='sofa'){
    const [sofa,table,vase]=await Promise.all([load('sofa_03'),load('modern_coffee_table_01'),load('ceramic_vase_03')]);if(cancelled)return;
    const seat=instance(sofa,w*.95,d*.64,.93);seat.position.z=-d*.15;arrangement.add(seat);
    const coffee=instance(table,w*.48,d*.23,.38);coffee.position.set(w*.13,0,d*.36);arrangement.add(coffee);
    const h=new T.Box3().setFromObject(coffee).max.y;const accessory=instance(vase,.12,.12,.22);accessory.position.set(w*.13,h,d*.36);arrangement.add(accessory);
   }else{
    const [chair,vase,pendant]=await Promise.all([load('dining_chair_02'),load('ceramic_vase_03'),load('modern_ceiling_lamp_01')]);if(cancelled)return;
    // The bespoke dining table remains in the plan footprint; only the chairs and accessories change.
    const oak=new T.MeshStandardMaterial({color:'#bb9d75',roughness:.5});const loader=new T.TextureLoader();oak.map=loader.load('/varandas-sto-antonio-imobretanha/assets/materials/oak-color.jpg');oak.map.colorSpace=T.SRGBColorSpace;oak.userData.ownedMap=true;
    const top=new T.Mesh(new T.CylinderGeometry(w*.275,w*.275,.055,64),oak);top.scale.z=d*.70/(w*.55);top.position.y=.755;top.castShadow=top.receiveShadow=true;arrangement.add(top);
    for(const x of [-1,1])for(const z of [-1,1]){const leg=new T.Mesh(new T.CylinderGeometry(.028,.038,.72,12),oak);leg.position.set(x*w*.17,.37,z*d*.23);leg.castShadow=true;arrangement.add(leg)}
    for(const side of [-1,1])for(const z of [-.25,.25]){const c=instance(chair,d*.20,w*.20,.85);c.rotation.y=-side*Math.PI/2;c.position.set(side*w*.39,0,z*d);arrangement.add(c)}
    const accessory=instance(vase,.14,.14,.25);accessory.position.y=.785;arrangement.add(accessory);
    const light=instance(pendant,.6,.6,.55);light.position.y=2.08;arrangement.add(light);
   }
   if(cancelled){dispose(arrangement);return}parent.add(arrangement);loaded.push(arrangement);slot.fallback.visible=false;slot.fallback.userData.upgraded=true;
  }catch{dispose(arrangement);/* Keep the original complete arrangement, including collision footprints. */}
 }
 slots.forEach(slot=>void prepare(slot));
 return ()=>{cancelled=true;for(const g of loaded){g.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.ownedMap)(m as T.MeshStandardMaterial).map?.dispose()});} };
}
