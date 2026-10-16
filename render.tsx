import {renderToString} from 'react-dom/server';
import Site from './app/site';
import {initialUnits} from './lib/catalog';
import {route} from './route';
export function render(path:string){return renderToString(<Site initial={initialUnits} {...route(path)} contactEnabled={false}/>);}
