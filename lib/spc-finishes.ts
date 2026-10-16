import * as T from 'three';
import {pointInPolygon} from './navigation';


let floorSample:T.Texture|undefined;
export function spcFloor(){
 const m=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.72,clearcoat:.04,clearcoatRoughness:.78});
 m.name='Oak flooring — supplied client sample';m.userData.finish='spc-floor';
 if(!floorSample){floorSample=new T.TextureLoader().load('/varandas-sto-antonio-imobretanha/assets/materials/client-floor-oak.webp');floorSample.colorSpace=T.SRGBColorSpace;floorSample.anisotropy=2;}
 m.map=floorSample;
 // Metre-based UVs. Board size is illustrative, retained from the existing floor scale.
 // Use the supplied photograph, excluding the blue sample-holder at its left edge.
 m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
 #ifdef USE_MAP
 float row=floor(vMapUv.y/.228);
 float stagger=fract(row*.381966);
 vec2 plank=vec2(vMapUv.x/1.22+stagger,vMapUv.y/.228);
 vec2 tile=fract(plank);
 vec2 cell=floor(plank);
 float flip=step(.5,fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453));
 vec2 sampleUv=vec2(.065+tile.y*.91,.02+mix(tile.x,1.-tile.x,flip)*.96);
 vec4 grain=texture2D(map,sampleUv);
 vec2 edges=min(tile,1.-tile)*vec2(1.22,.228);
 float joint=smoothstep(0.,.0008,min(edges.x,edges.y));
 grain.rgb*=mix(.78,1.,joint);
 diffuseColor*=grain;
 #endif
 `)};
 m.customProgramCacheKey=()=> 'client-oak-floor-staggered-v1';
 return m;
}
let zenithSample:T.Texture|undefined;
export function spcWall(){
 const m=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.68,clearcoat:.08,clearcoatRoughness:.7});
 m.name='ZENITH / WM 504C — supplied sample';m.userData.finish='spc-wall';
 if(!zenithSample){zenithSample=new T.TextureLoader().load('/varandas-sto-antonio-imobretanha/assets/materials/zenith-wm504c-sample.png');zenithSample.colorSpace=T.SRGBColorSpace;zenithSample.anisotropy=2;}
 m.map=zenithSample;
 // Sample the photograph itself. UV cropping excludes its label and outer edges;
 // mirrored repetition avoids discontinuous tile boundaries without repainting it.
 m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
 #ifdef USE_MAP
 vec2 sampleTile = 1.0-abs(mod(vMapUv/vec2(0.60,1.15),2.0)-1.0);
 vec2 sampleUv = vec2(0.04,0.05)+sampleTile*vec2(0.88,0.82);
 diffuseColor *= texture2D(map,sampleUv);
 #endif
 `)};
 m.customProgramCacheKey=()=> 'zenith-wm504c-client-sample-v1';
 return m;
}
export function finishWalls(geo:T.BufferGeometry,zones:number[][][],scale:number,cx:number,cy:number){
 const pos=geo.getAttribute('position'),normal=geo.getAttribute('normal'),uv=geo.getAttribute('uv'),dry:number[]=[],wet:number[]=[];
 for(let i=0;i<pos.count;i++)uv.setXY(i,Math.abs(normal.getX(i))>.7?pos.getZ(i):pos.getX(i),pos.getY(i));
 for(let i=0;i<pos.count;i+=3){
  const nx=normal.getX(i),nz=normal.getZ(i);
  const x=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,z=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3;
  const sample:[number,number]=[(x+nx*.045)/scale+cx,(z+nz*.045)/scale+cy];
  const isWet=Math.abs(normal.getY(i))<.1&&zones.some(zone=>pointInPolygon(sample,zone));
  (isWet?wet:dry).push(i,i+1,i+2);
 }
 geo.setIndex([...dry,...wet]);geo.clearGroups();geo.addGroup(0,dry.length,0);if(wet.length)geo.addGroup(dry.length,wet.length,1);
 geo.userData.wetTriangleCount=wet.length/3;
}
