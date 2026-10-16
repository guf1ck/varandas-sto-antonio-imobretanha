import seed from '../data/units.json';
export type Status='available'|'reserved'|'sold'|'unconfirmed';
export type Unit=Omit<typeof seed[number],'status'|'price'|'modelObject'|'commercialUpdatedAt'> & {status:Status;price:number|null;modelObject:string|null;commercialUpdatedAt:string|null;version?:number};
export const initialUnits=seed as Unit[];
export const statusLabels:Record<Status,string>={available:'Disponível',reserved:'Reservada',sold:'Vendida',unconfirmed:'Por confirmar'};
export const canVisit=(unit?:Pick<Unit,'status'>)=>unit?.status==='available';
export const money=(n:number)=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
export const area=(n:number)=>new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2}).format(n)+' m²';
export function matches(u:Unit,f:{type:string;floor:string;status:string;price:string;building:string}){return (!f.type||u.typology===f.type)&&(!f.floor||String(u.floor)===f.floor)&&(!f.status||u.status===f.status)&&(!f.building||String(u.building)===f.building)&&(!f.price||(u.price!==null&&u.price<=Number(f.price)));}
