// Netlify Function para manejar el OAuth callback
exports.handler = async (event, context) => {
  // Extraer parámetros de la URL
  const { code, state, error } = event.queryStringParameters || {};

  // HTML de respuesta
  const html = `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Calendar Auth Callback</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 50px;
      }
      .success {
        color: #155724;
        background: #d4edda;
        padding: 20px;
        border-radius: 5px;
        margin: 20px 0;
      }
      .error {
        color: #721c24;
        background: #f8d7da;
        padding: 20px;
        border-radius: 5px;
        margin: 20px 0;
      }
    </style>
  </head>
  <body>
    ${error ? `
    <h1>❌ Error de Autorización</h1>
    <div class="error">
      <p>Error: ${error}</p>
      <p><a href="/">← Volver a la aplicación</a></p>
    </div>
    ` : `
    <h1>🎉 Autorización Exitosa</h1>
    <div class="success">
      <p>✅ Has autorizado correctamente el acceso a Google Calendar</p>
      <p>🔄 Procesando autorización...</p>
    </div>
    `}

    <script>
      // Solo procesar si no hay error
      ${!error && code ? `
      const code = '${code}';
      const state = '${state}';
      
      if (code && (state === 'calendar_auth' || state === 'calendar_auth_main')) {
        console.log('✅ Código de autorización recibido:', code.substring(0, 20) + '...');

        // Guardar en localStorage para que el test principal pueda accederlo
        localStorage.setItem('calendar_auth_code', code);
        localStorage.setItem('calendar_auth_state', state);
        localStorage.setItem('calendar_auth_timestamp', Date.now().toString());

        // Mensaje para el usuario
        document.querySelector('.success p:last-child').innerHTML = 
          '✅ Autorización guardada. Redirigiendo...';

        // Redirigir después de un breve delay
        setTimeout(() => {
          // Intentar cerrar la ventana primero (si es popup)
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                code: code,
                state: state
              }, '*');
              window.close();
              return;
            }
          } catch (e) {
            console.log('No se pudo cerrar como popup, redirigiendo...');
          }

          // Si no es popup, redirigir a la página principal
          window.location.href = '/';
        }, 2000);
      }
      ` : ''}
    </script>
  </body>
</html>
  `;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    },
    body: html
  };
};
