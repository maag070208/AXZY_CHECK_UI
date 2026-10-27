import { chromium } from '@playwright/test'; const b=await chromium.launch(); const p=await b.newPage();
await p.goto('http://localhost:5002/#/login'); await p.locator('input[name=username]').fill('marcoh'); await p.locator('input[name=password]').fill('123456'); await p.getByRole('button',{name:/Iniciar sesión/i}).click(); await p.waitForURL(/home/); await p.waitForTimeout(2000);
console.log(await p.evaluate(()=>[...document.querySelectorAll('header img, nav img, [class*=top] img')].map(i=>({src:i.src, w:i.width,h:i.height})).slice(0,5)));
console.log(await p.evaluate(()=>localStorage.getItem('lastRole')));
await b.close();
