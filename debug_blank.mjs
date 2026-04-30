import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3001/');
  
  try {
    await page.click('text=Login Now', { timeout: 5000 });
    
    await page.fill('input[placeholder="Enter your Email, Phone, or ID"]', 'pat1@test.com', { timeout: 5000 });
    await page.fill('input[type="password"]', 'hospital123');
    await page.click('button:has-text("Login")');
    
    await page.waitForSelector('text=Book Lab', { timeout: 10000 });
    
    await page.click('text=Book Lab');
    
    await page.waitForTimeout(3000); // Give it time to render the error
    
    // Check if error boundary rendered
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('Crash!')) {
       console.log("REACT CRASH TEXT:");
       console.log(text.substring(text.indexOf('Crash!'), text.indexOf('Go Back') + 7));
    } else {
       console.log("No crash found on Book Lab.");
    }

  } catch (e) {
    console.log("Error:", e.message);
  }

  await browser.close();
})();
