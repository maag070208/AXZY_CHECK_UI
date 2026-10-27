import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5002/#/login'); await p.locator('input[name=username]').fill('isabel'); await p.locator('input[name=password]').fill('123456'); await p.getByRole('button',{name:/Iniciar sesión/i}).click(); await p.waitForURL(/home/); await p.goto('http://localhost:5002/#/invitations'); await p.waitForTimeout(2500);
const qr=p.getByRole('button',{name:'Ver gafete QR'}).first();
console.log('qr count',await qr.count());
if(await qr.count()){await qr.click(); await p.waitForTimeout(1500);}
await p.screenshot({path:'public/landing/preview/invitation-qr.png'}); await b.close();
