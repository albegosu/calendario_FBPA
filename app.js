const puppeteer = require('puppeteer');
const ics = require('ics');
const fs = require('fs');
const cron = require('node-cron');
const { importarCalendario } = require('./google-calendar.js');

// URL de la página a extraer
const url = 'https://www.fbpa.es/competicion-17398/competiciones-federadas/';

// Función para extraer datos del calendario
async function extraerDatos() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);

  // Selecciona el contenedor del calendario
  const partidos = await page.evaluate(() => {
    const calendarioContainer = document.querySelector('#nav-calendario');
    if (!calendarioContainer) return [];

    const filas = calendarioContainer.querySelectorAll('table tbody tr');
    const resultados = [];

    filas.forEach((fila) => {
      const celdas = fila.querySelectorAll('td');
      if (celdas.length > 0) {
        const local = celdas[0].textContent.trim();
        const visitante = celdas[3].textContent.trim();
        const fecha = celdas[4].textContent.trim();
        const campo = celdas[5].textContent.trim();

        // Filtrar por el equipo específico
        if (local.includes('A.A. INMACULADA APV') || visitante.includes('A.A. INMACULADA APV')) {
          resultados.push({ local, visitante, fecha, campo });
        }
      }
    });

    return resultados;
  });

  await browser.close();
  return partidos;
}

// Función para generar archivo .ICS
function generarICS(partidos) {
  const eventos = partidos.map((partido) => {
    const [fecha, hora] = partido.fecha.split('\n');
    const [dia, mes, año] = fecha.split('/').map((v) => parseInt(v, 10));
    const [horaH, min] = hora.split(':').map((v) => parseInt(v, 10));

    return {
      title: `${partido.local} vs ${partido.visitante}`,
      start: [año, mes, dia, horaH, min],
      duration: { hours: 2 }, // Duración aproximada del partido
      location: partido.campo,
      description: 'Partido de baloncesto.',
    };
  });

  // Generar archivo .ICS
  const { error, value } = ics.createEvents(eventos);
  if (error) {
    console.error('Error al generar archivo .ICS:', error);
    return;
  }

  // Guardar archivo en el sistema local
  fs.writeFileSync('calendario_inmaculada.ics', value);
  console.log('Archivo .ICS generado exitosamente: calendario_inmaculada.ics');
}

// Función principal para manejar el flujo
async function actualizarCalendario() {
  console.log('Extrayendo datos del calendario...');
  const partidos = await extraerDatos();
  console.log(`Se encontraron ${partidos.length} partidos.`);
  generarICS(partidos);

  // Llamar a la función para importar el calendario a Google
  console.log('Importando los eventos al Google Calendar...');
  await importarCalendario();
}

//CAMBIO PRUEBA COMMIT FIRMADO

// Programar la tarea para ejecutarse periódicamente (ejemplo: todos los días a las 6 AM)
cron.schedule('0 6 * * *', actualizarCalendario); // Cambia la frecuencia según lo necesites

// Ejecutar una vez al iniciar
actualizarCalendario();

//commit firmado