import puppeteer from 'puppeteer';

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    
    console.log('Navigating to http://localhost:3000/dashboard/customers...');
    await page.goto('http://localhost:3000/dashboard/customers', { waitUntil: 'networkidle2' });
    
    // Wait an extra second to ensure any client-side rendering is complete
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'public/assets/customers_dashboard.webp', 
      type: 'webp',
      quality: 90
    });
    
    console.log('Screenshot saved to public/assets/customers_dashboard.webp');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to take screenshot:', err);
    process.exit(1);
  }
})();
