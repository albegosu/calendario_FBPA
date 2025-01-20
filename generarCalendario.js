const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const { createEvents } = require('ics');

// URL de la página web (reemplaza con tu enlace)
const url = 'https://tu-enlace-a-la-pagina.com';

async function obtenerDatosDePagina(url) {
    try {
        // Obtener el HTML de la página
        const { data: html } = await axios.get(url);

        // Analizar el HTML usando jsdom
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Seleccionar el contenedor del calendario
        const calendarioContainer = document.querySelector('#nav-calendario');

        if (!calendarioContainer) {
            console.error("No se encontró el contenedor con id 'nav-calendario'");
            return [];
        }

        // Extraer los partidos de la tabla
        const filas = calendarioContainer.querySelectorAll('table tbody tr');
        const partidos = [];

        filas.forEach(fila => {
            const celdas = fila.querySelectorAll('td');

            if (celdas.length > 0) {
                const local = celdas[0].textContent.trim();
                const visitante = celdas[3].textContent.trim();
                const fecha = celdas[4].textContent.trim();
                const campo = celdas[5].textContent.trim();

                // Filtrar por partidos de "A.A. INMACULADA APV"
                if (local.includes("A.A. INMACULADA APV") || visitante.includes("A.A. INMACULADA APV")) {
                    partidos.push({ local, visitante, fecha, campo });
                }
            }
        });

        return partidos;
    } catch (error) {
        console.error('Error obteniendo datos de la página:', error);
        return [];
    }
}

function convertirFecha(fechaStr) {
    const año = parseInt(fechaStr.slice(6, 10), 10);
    const mes = parseInt(fechaStr.slice(3, 5), 10);
    const día = parseInt(fechaStr.slice(0, 2), 10);
    const hora = parseInt(fechaStr.slice(10, 12) || '0', 10);
    const minuto = parseInt(fechaStr.slice(13, 15) || '0', 10);

    return [año, mes, día, hora, minuto];
}

async function generarICS(url) {
    // Obtener los datos de los partidos
    const partidos = await obtenerDatosDePagina(url);

    if (partidos.length === 0) {
        console.log('No se encontraron partidos.');
        return;
    }

    // Convertir los partidos en eventos para ICS
    const eventos = partidos.map(partido => {
        const [año, mes, día, hora, minuto] = convertirFecha(partido.fecha);

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
}

// Ejecutar la función
generarICS(url);