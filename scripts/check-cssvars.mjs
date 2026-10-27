import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage();
await p.goto('http://localhost:5002/#/login'); await p.waitForTimeout(500);
console.log(await p.evaluate(()=>Object.fromEntries([...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch{return []}}).filter(r=>r.selectorText===':root'||r.selectorText==='html').flatMap(r=>[...r.style].filter(x=>x.startsWith('--')).map(x=>[x,r.style.getPropertyValue(x)])))));
await b.close();
