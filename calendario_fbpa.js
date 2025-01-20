const puppeteer = require('puppeteer');
const { createEvents } = require('ics');
const fs = require('fs');

async function extraerDatosYGenerarICS() {
    const url = 'https://www.fbpa.es/competicion-17398/competiciones-federadas-';

    // Inicia el navegador
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Abre la página web
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Selecciona la categoría y la fase en los desplegables
    console.log('Seleccionando filtros...');

    // Seleccionar categoría
    await page.select('#ctl00_ctl00_contenedor_informacion_contenedor_informacion_con_lateral_DDLCategorias', 
        '17751'); // Selecciona "PRIMERA FBPA Fem"

    // Esperar a que se actualice la página después de seleccionar la categoría
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Seleccionar fase
    await page.select('#ctl00_ctl00_contenedor_informacion_contenedor_informacion_con_lateral_DDLFases', 
       '995'); // Selecciona "2ª Fase"

    // Esperar a que se actualice la página después de seleccionar la fase
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Selecciona la pestaña "CALENDARIO" y haz clic en ella
    console.log('Seleccionando pestaña CALENDARIO...');
    await page.click('#nav-calendario-tab');

    // Espera a que la tabla del calendario se cargue
    await page.waitForSelector('#nav-calendario table tbody tr');


    // Extraer datos de los partidos
    console.log('Extrayendo datos...');
    const partidos = await page.evaluate(() => {
        const filas = document.querySelectorAll('#nav-calendario table tbody tr');
        const datos = [];

        filas.forEach(fila => {
            const celdas = fila.querySelectorAll('td');
            if (celdas.length > 0) {
                const local = celdas[0].textContent.trim();
                const visitante = celdas[3].textContent.trim();
                const fecha = celdas[4].textContent.trim();
                const campo = celdas[5].textContent.trim();

                if (local.includes('A.A. INMACULADA APV') || visitante.includes('A.A. INMACULADA APV')) {
                    datos.push({ local, visitante, fecha, campo });
                }
            }
        });

        return datos;
    });

    console.log(`Se encontraron ${partidos.length} partidos.`);

    // Convertir los partidos en formato ICS
    if (partidos.length > 0) {
        const eventos = partidos.map(partido => {
            const [día, mes, año, hora, minuto] = convertirFecha(partido.fecha);
            return {
                title: `${partido.local} vs ${partido.visitante}`,
                start: [año, mes, día, hora, minuto],
                location: partido.campo,
                description: `Partido entre ${partido.local} y ${partido.visitante}`,
            };
        });

        // Crear el archivo .ICS
        createEvents(eventos, (error, value) => {
            if (error) {
                console.error('Error creando el archivo ICS:', error);
                return;
            }

            const nombreArchivo = 'calendario.ics';
            fs.writeFileSync(nombreArchivo, value);
            console.log(`Archivo .ICS generado exitosamente: ${nombreArchivo}`);
        });
    } else {
        console.log('No se encontraron partidos para los filtros seleccionados.');
    }

    // Cerrar el navegador
    await browser.close();
}

// Función para convertir fecha de string a formato compatible con ICS
function convertirFecha(fechaStr) {
    const día = parseInt(fechaStr.slice(0, 2), 10);
    const mes = parseInt(fechaStr.slice(3, 5), 10);
    const año = parseInt(fechaStr.slice(6, 10), 10);
    const hora = parseInt(fechaStr.slice(10, 12) || '0', 10);
    const minuto = parseInt(fechaStr.slice(13, 15) || '0', 10);

    return [día, mes, año, hora, minuto];
}

// Ejecutar el script
extraerDatosYGenerarICS();