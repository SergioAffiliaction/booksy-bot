import puppeteer from 'puppeteer-core';

// 1) Manejador global de promesas rechazadas
process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
  // process.exit(1); // Descomenta si prefieres que el contenedor se detenga al error
});

async function main() {
  try {
    // 2) Conexión a Browserless
    const browser = await puppeteer.connect({
      browserWSEndpoint:
        'wss://evolution-browserless.ej5nry.easypanel.host?token=f8739ea8ce80b7350283ff8adf10ca9c',
      ignoreHTTPSErrors: true
    });

    // 3) Nueva pestaña y handlers de error
    const page = await browser.newPage();
    page.on('error', err => console.error('PAGE ERROR:', err));
    page.on('pageerror', err => console.error('PAGE EVALUATION ERROR:', err));

    // 4) Viewport
    await page.setViewport({ width: 1280, height: 800 });

    // === Tu flujo de Booksy ===

    // 5) Login
    await page.goto('https://booksy.com/pro/es-es/login', { waitUntil: 'networkidle2' });
    await page.type('#email', process.env.BOOKSY_USER);
    await page.type('#password', process.env.BOOKSY_PASS);
    await page.click('button[type=submit]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // 6) Ir al calendario del día
    await page.goto(
      'https://booksy.com/pro/es-es/147498/calendar?date=today&view=day&staffers=working',
      { waitUntil: 'networkidle2' }
    );

    // 7) Extraer slots disponibles
    const slots = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.slot')).map(el => el.innerText)
    );
    console.log('Slots disponibles:', slots);

    // 8) (Opcional) Reserva el primer slot
    if (slots.length) {
      await page.click('.slot');
      await page.waitForSelector('form.booking-form');
      await page.type('input[name="clientName"]', 'Juan Pérez');
      await page.type('input[name="clientPhone"]', '+34123456789');
      await page.click('button.confirm-booking');
      await page.waitForSelector('.booking-success');
      console.log('¡Reserva completada!');
    }

    // === Fin del flujo ===

    await browser.close();
    console.log('✅ Script finalizado con éxito.');
  } catch (err) {
    console.error('❌ Ha saltado un error en main():', err);
    // process.exit(1);
  }
}

main();
