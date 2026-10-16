import fs from 'node:fs/promises';
import {render} from '../.prerender/render.js';
const base='/varandas-sto-antonio-imobretanha/';
const origin='https://guf1ck.github.io';
const units=JSON.parse(await fs.readFile('data/units.json','utf8'));
const routes=['','apartamentos','projeto','perguntas','contacto',...units.map(u=>'fracao/'+u.id.toLowerCase())];
const titles={'':'Apartamentos T3 e T4 em Portalegre','apartamentos':'Apartamentos e disponibilidade','projeto':'O empreendimento em Portalegre','perguntas':'Perguntas frequentes','contacto':'Contactos e visitas'};
const template=await fs.readFile('dist/index.html','utf8');
const description='Descubra os apartamentos T3 e T4 das Varandas de Stº António, em Portalegre. Explore o edifício em 3D e marque uma visita com a Imobretanha.';
for(const slug of routes){
 const path=base+slug+(slug?'/':'');
 const title=(titles[slug]||`Fração ${slug.split('/')[1].toUpperCase()}`)+' | Varandas de Stº António · Imobretanha';
 const seo=`<meta name="description" content="${description}"/><link rel="canonical" href="${origin+path}"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${description}"/><meta property="og:url" content="${origin+path}"/><meta property="og:type" content="website"/><meta property="og:locale" content="pt_PT"/><meta property="og:image" content="${origin+base}assets/vista-21.webp"/><meta name="twitter:card" content="summary_large_image"/>`;
 const html=template.replace(/<title>.*?<\/title>/,`<title>${title}</title>`).replace('<!--seo-->',seo).replace('<!--app-->',render(path));
 await fs.mkdir('dist/'+slug,{recursive:true});await fs.writeFile('dist/'+(slug?slug+'/':'')+'index.html',html);
}
await fs.writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(s=>`<url><loc>${origin+base+s+(s?'/':'')}</loc></url>`).join('')}</urlset>`);
await fs.writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin+base}sitemap.xml\n`);
await fs.writeFile('dist/catalog.json',JSON.stringify({units}));
await fs.writeFile('dist/.nojekyll','');
await fs.writeFile('dist/404.html',`<!doctype html><html lang="pt-PT"><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Página não encontrada</title><body style="font-family:Arial;padding:10%;background:#f7f6f2"><h1>Página não encontrada</h1><a href="${base}">Voltar às Varandas de Stº António</a></body></html>`);
console.log(`Prerendered ${routes.length} routes with correct GitHub Pages base.`);
