import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('CONSOLE:', msg.text(), msg.location().url));
    page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));
    
    await page.goto('http://localhost:3333', { waitUntil: 'networkidle0' });
    
    const computed = await page.evaluate(() => {
      return {
        tc_display: getComputedStyle(document.getElementById('title-card')).display,
        menu_display: getComputedStyle(document.getElementById('main-menu')).display,
        cov_display: getComputedStyle(document.getElementById('transition-cover')).display,
        menu_bg: getComputedStyle(document.getElementById('main-menu')).backgroundColor,
        menu_zi: getComputedStyle(document.getElementById('main-menu')).zIndex,
        game_zi: getComputedStyle(document.getElementById('game')).zIndex
      }
    });
    console.log('COMPUTED:', computed);
    
    await browser.close();
  } catch (e) {
    console.error('SCRIPT_ERROR:', e);
  }
})();
