const { google } = require('googleapis');
const fs = require('fs');
const ical = require('ical');

// Configuración de autenticación con Google API
async function autenticarGoogle() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return auth.getClient();
}

// Función para cargar el archivo .ICS
function cargarICS(archivo) {
  const data = fs.readFileSync(archivo, 'utf8');
  return ical.parseICS(data); // Debería devolver un objeto con eventos
}

// Crear eventos en Google Calendar
async function crearEventos(auth, eventos, calendarId = 'primary') {
  const calendar = google.calendar({ version: 'v3', auth });

  for (const key in eventos) {
    const evento = eventos[key];
    
    // Asegurarse de que las fechas sean correctas
    if (!evento.start || !evento.end) continue;

    const googleEvento = {
      summary: evento.summary || 'Sin título',
      location: evento.location || '',
      description: evento.description || '',
      start: {
        dateTime: evento.start,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: evento.end,
        timeZone: 'Europe/Madrid',
      },
    };

    try {
      const res = await calendar.events.insert({
        calendarId,
        resource: googleEvento,
      });
      console.log(`Evento creado: ${res.data.summary}`);
    } catch (err) {
      console.error('Error al crear evento:', err.message);
    }
  }
}

// Función principal para importar el calendario
async function importarCalendario() {
  const auth = await autenticarGoogle();

  // Ruta del archivo .ICS
  const archivoICS = 'calendario_inmaculada.ics';
  
  console.log('Cargando archivo .ICS...');
  const eventos = cargarICS(archivoICS);

  console.log('Importando eventos a Google Calendar...');
  await crearEventos(auth, eventos);
}

// Ejecutar la importación
importarCalendario()
  .then(() => console.log('Calendario importado con éxito.'))
  .catch((err) => console.error('Error al importar el calendario:', err));

  module.exports = {
    importarCalendario,
  };  