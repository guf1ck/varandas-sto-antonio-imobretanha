import {hydrateRoot} from 'react-dom/client';
import Site from './app/site';
import {initialUnits} from './lib/catalog';
import {route} from './route';
import './app/globals.css';
import './app/premium.css';
hydrateRoot(document.getElementById('root')!,<Site initial={initialUnits} {...route(location.pathname)} contactEnabled={false}/>);
