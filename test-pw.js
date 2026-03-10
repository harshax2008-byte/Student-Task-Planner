const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:8080/index.html');
  await page.waitForTimeout(2000);

  // simulate login if necessary
  const loginSection = await page.$('#login-section');
  const appSection = await page.$('#app-section');
  const loginVisible = await loginSection.isVisible();
  console.log('Login visible:', loginVisible);
  if (loginVisible) {
      await page.fill('#student-id', 'test');
      await page.fill('#password', 'test');
      await page.click('.login-btn');
      await page.waitForTimeout(2000);
  }
  const customOption = await page.$('#reminder-sound option[value="custom"]');
  console.log('Custom option found:', !!customOption);
  
  await browser.close();
})();
