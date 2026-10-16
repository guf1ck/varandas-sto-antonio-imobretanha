import * as T from 'three';

/** An illustrative urban setting, not surveyed terrain or georeferenced map tiles. Street View reference: supplied Google Maps point, Nov 2024.
 * MD p.3: sloping land, elevated rear square, consolidated urban surroundings. */
// Visual longitudinal grade; not a surveyed elevation profile.
export const roadCenterZ=(x:number)=>23+Math.max(0,x-28)**2*.007+Math.max(0,-x-45)**2*.003;
export const roadElevation=(x:number)=>-.70-.065*x;
export function terrainElevation(x:number,z:number){
 const rear=T.MathUtils.smoothstep(-z,10,36)*9.5;
 const far=T.MathUtils.smoothstep(Math.hypot(x,z),115,260);
 const base=-.94+rear+far*(6+11*Math.sin(x*.019)*Math.sin(z*.012));
 const streetInfluence=(1-T.MathUtils.smoothstep(Math.abs(z-roadCenterZ(x)),7,30))*(1-T.MathUtils.smoothstep(Math.abs(x),120,155));
 const street=T.MathUtils.lerp(base,roadElevation(x)-.24,streetInfluence);
 // Excavation for the east garage approach; avoid terrain filling the -1 portal.
 const cutX=T.MathUtils.smoothstep(x,24,28)*(1-T.MathUtils.smoothstep(x,49,55));
 const cutZ=T.MathUtils.smoothstep(z,-13,-8)*(1-T.MathUtils.smoothstep(z,28,34));
 return T.MathUtils.lerp(street,Math.min(street,-3.75),cutX*cutZ);
}
export function makeSiteEnvironment(inside=false,floor=0,mobile=false){
 const root=new T.Group();root.name='architectural-presentation';
 const built=new T.Group();root.add(built);built.position.y=inside?-floor*3.05:0;
 // Neutral architectural presentation: no invented neighbouring buildings, cars or landscaping.
 const textures:T.Texture[]=[];
 const ground=new T.MeshStandardMaterial({color:'#d5d2c9',roughness:.96});
 const land=new T.PlaneGeometry(1100,1100,100,100);land.rotateX(-Math.PI/2);
 const pos=land.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);const blend=1-T.MathUtils.smoothstep(Math.hypot(x,z),42,85);pos.setY(i,T.MathUtils.lerp(-2,terrainElevation(x,z),blend));}
 land.computeVertexNormals();const terrain=new T.Mesh(land,ground);terrain.receiveShadow=true;built.add(terrain);
 // A quiet strip preserves the sloping access as a spatial reference, without simulated urban density.
 const vertices:number[]=[];
 for(let i=0;i<48;i++){const x=-60+i*2.5,n=x+2.5;for(const [xx,side] of [[x,-1],[n,1],[n,-1],[x,-1],[x,1],[n,1]])vertices.push(xx,roadElevation(xx)+.04,roadCenterZ(xx)+side*3.5);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const road=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#aaa9a3',roughness:.98}));road.receiveShadow=true;built.add(road);
 const sky=new T.Mesh(new T.SphereGeometry(700,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{warm:{value:0},sun:{value:new T.Vector3()}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 v;uniform float warm;uniform vec3 sun;
 void main(){vec3 d=normalize(v);float h=pow(max(d.y,0.),.42);vec3 day=mix(vec3(.25,.56,.94),vec3(.035,.22,.62),h);vec3 dusk=mix(vec3(.88,.57,.38),vec3(.12,.24,.48),h);vec3 c=mix(day,dusk,warm);float disk=smoothstep(.99982,.99994,dot(d,sun));c+=vec3(1.,.87,.61)*disk*2.;gl_FragColor=vec4(c,1.);}`}));sky.name='atmospheric-sky';sky.renderOrder=-2;root.add(sky);
 const clouds=new T.Mesh(new T.SphereGeometry(590,24,12),new T.ShaderMaterial({side:T.BackSide,transparent:true,depthWrite:false,uniforms:{warm:{value:0}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 v;uniform float warm;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){vec3 d=normalize(v);vec2 p=d.xz/max(.03,d.y)*2.;float n=noise(p)*.58+noise(p*2.1)*.28+noise(p*4.2)*.14;float a=smoothstep(.56,.71,n)*smoothstep(.10,.25,d.y)*.88;gl_FragColor=vec4(mix(vec3(.97,.98,1.),vec3(1.,.81,.65),warm),a);}` }));clouds.renderOrder=1;root.add(clouds);
 const sunDirection=new T.Vector3();
 const update=(light:number)=>{sunDirection.set(-.65+light*.25,.8-light*.65,.65).normalize();sky.material.uniforms.sun.value.copy(sunDirection);sky.material.uniforms.warm.value=light;clouds.material.uniforms.warm.value=light;return sunDirection};update(0);
 return {root,update,dispose:()=>textures.forEach(t=>t.dispose())};
}
