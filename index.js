import puppeteer from 'puppeteer-core';
import http from 'http';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // cada 5 minutos

// 1) Healthcheck HTTP para EasyPanel
http
  .createServer((req, res) => res.end('OK'))
  .listen(3000, () => console.log('✅ Healthcheck escuchando en puerto 3000'));

// 2) Captura promesas rechazadas
process.on('unhandledRejection', reason => {
  console.error('🚨 UnhandledRejection:', reason);
});

// 3) Función principal: login, leer slots y (opcional) reservar
async function checkAndBook() {
  let browser;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint:
        'wss://evolution-browserless.ej5nry.easypanel.host?token=f8739ea8ce80b7350283ff8adf10ca9c',
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // ––––– LOGIN –––––
    await page.goto('https://booksy.com/pro/es-es/login', { waitUntil: 'networkidle2' });
    await page.type('#email', process.env.BOOKSY_USER);
    await page.type('#password', process.env.BOOKSY_PASS);
    await page.click('button[type=submit]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // ––––– CALENDARIO –––––
    await page.goto(
      'https://booksy.com/pro/es-es/147498/calendar?date=today&view=day&staffers=working',
      { waitUntil: 'networkidle2' }
    );

    // ––––– EXTRAE SLOTS –––––
    const slots = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.slot')).map(el => el.innerText)
    );
    console.log(new Date().toISOString(), 'Slots disponibles:', slots);

    // ––––– (OPCIONAL) RESERVA –––––
    if (slots.length) {
      console.log('👉 Hueco encontrado, intento reservar…');
      await page.click('.slot');
      await page.waitForSelector('form.booking-form');
      await page.type('input[name="clientName"]', 'Juan Pérez');
      await page.type('input[name="clientPhone"]', '+34123456789');
      await page.click('button.confirm-booking');
      await page.waitForSelector('.booking-success');
      console.log('🎉 ¡Reserva completada!');
    }

  } catch (err) {
    console.error('❌ Error en checkAndBook():', err);
  } finally {
    if (browser) await browser.close();
  }
}

// 4) Primera ejecución + ciclo periódico
checkAndBook();
setInterval(checkAndBook, POLL_INTERVAL_MS);
