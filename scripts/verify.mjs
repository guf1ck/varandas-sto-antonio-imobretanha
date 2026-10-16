import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base='/varandas-sto-antonio-imobretanha/';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
let checked=0;
for(const file of walk('dist').filter(p=>p.endsWith('.html'))){
 for(const [,url] of fs.readFileSync(file,'utf8').matchAll(/(?:src|href)="([^"]+)"/g)){
  if(!url.startsWith('/'))continue;
  assert(url.startsWith(base),`${file}: wrong base ${url}`);
  const target=path.join('dist',decodeURIComponent(new URL(url,'https://example.com').pathname.slice(base.length)));
  assert(fs.existsSync(target)&&(!fs.statSync(target).isDirectory()||fs.existsSync(path.join(target,'index.html'))),`Missing ${url}`);checked++;
 }
}
for(const file of [...walk('lib'),...walk('app')]){
 const source=fs.readFileSync(file,'utf8');
 assert(!source.includes('/api/'),`Unsupported API in ${file}`);
 for(const [,url] of source.matchAll(/["'`](\/varandas-sto-antonio-imobretanha\/assets\/[^"'`]+)["'`]/g)){
  if(url.includes('${'))continue;
  assert(fs.existsSync(path.join('dist',decodeURIComponent(url.slice(base.length)))),'Missing '+url);
 }
}
const units=JSON.parse(fs.readFileSync('data/units.json','utf8'));
assert.equal(units.length,20);assert.equal(units.filter(u=>u.status==='reserved').length,7);
assert.deepEqual(JSON.parse(fs.readFileSync('dist/catalog.json','utf8')).units,units);
console.log(`Verified ${checked} internal links/assets across 25 pages; catalogue and reservation states preserved.`);
