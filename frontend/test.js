import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173/new');
  await page.type('input[placeholder="John Doe"]', 'Test');
  await page.type('input[placeholder="45"]', '50');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const simButton = Array.from(await page.$$('button')).find(async b => {
    const text = await page.evaluate(el => el.textContent, b);
    return text.includes('Run Simulation') || text.includes('Execute Simulation');
  });
  
  if (simButton) {
     console.log('Found simulate button. Clicking...');
     const text = await page.evaluate(el => el.textContent, simButton);
     if (text.includes('Run Simulation')) {
        await simButton.click();
        await new Promise(r => setTimeout(r, 3000));
     }
  } else {
    // try direct click by evaluating
    await page.evaluate(() => {
       const btns = Array.from(document.querySelectorAll('button'));
       const tgt = btns.find(b => b.textContent.includes('Run Simulation'));
       if(tgt) tgt.click();
    });
    await new Promise(r => setTimeout(r, 3000));
  }
  
  await browser.close();
})();
