async function sincronizarGoogleDriveYCalendar() {
    const auth = await autenticarGoogle();
    await subirArchivo(auth); // Subir a Google Drive
    await importarCalendario(); // Importar a Google Calendar
  }
  
  actualizarCalendario()
    .then(() => sincronizarGoogleDriveYCalendar())
    .catch((err) => console.error('Error durante la sincronización:', err));
  