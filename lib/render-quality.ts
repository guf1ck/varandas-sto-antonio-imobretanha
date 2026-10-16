export function renderQuality(memory:number|undefined,cores:number|undefined,saveData:boolean,width:number,dpr:number){
 const low=saveData||(memory!==undefined&&memory<=4)||(cores!==undefined&&cores<=4);
 const mobile=width<650;
 return {low,mobile,post:!low&&!mobile,pixelRatio:Math.min(dpr,low?1:mobile?1.25:1.5),shadowSize:low?512:mobile?1024:1536,fps:low?30:60};
}
