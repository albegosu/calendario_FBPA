const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

// El archivo .ics generado por el script anterior
const icsFilePath = 'calendario.ics';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

// Autenticar con Google y obtener el token de acceso
function authorize(callback) {
    const credentials = require('./credentials.json'); // Asegúrate de tener el archivo credentials.json
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

// Obtener un nuevo token de acceso si no existe
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.log('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            callback(oAuth2Client);
        });
    });
}

// Agregar el archivo ICS al calendario de Google
function addICSFileToGoogleCalendar(auth) {
    const calendar = google.calendar({ version: 'v3', auth });
    const icsData = fs.readFileSync(icsFilePath, 'utf-8');

    const event = {
        summary: 'Partidos FBPA',
        description: 'Calendario de partidos FBPA',
        start: {
            dateTime: '2025-01-01T09:00:00',
            timeZone: 'Europe/Madrid',
        },
        end: {
            dateTime: '2025-01-01T17:00:00',
            timeZone: 'Europe/Madrid',
        },
        location: 'Campo de fútbol',
        reminders: {
            useDefault: true,
        },
        attendees: [
            { email: 'example@example.com' },
        ],
    };

    // Usa el método `import` para cargar el archivo .ics
    calendar.events.import(
        {
            calendarId: 'primary',
            resource: event,
        },
        (err, res) => {
            if (err) return console.log('Error al agregar el evento al calendario:', err);
            console.log('Evento añadido a Google Calendar:', res.data);
        }
    );
}

// Ejecutar el script para autorizar y agregar el archivo ICS al calendario
authorize(addICSFileToGoogleCalendar);