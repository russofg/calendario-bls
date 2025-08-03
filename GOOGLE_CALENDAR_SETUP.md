# Configuración de Google Calendar API para EventPro

Esta guía te ayudará a configurar la integración con Google Calendar para sincronizar automáticamente tus eventos.

## 📋 Requisitos Previos

- Cuenta de Google
- Proyecto de EventPro funcionando
- Acceso a Google Cloud Console

## 🚀 Paso a Paso

### 1. Crear Proyecto en Google Cloud Console

1. **Accede a Google Cloud Console:**
   - Ve a: https://console.cloud.google.com/

2. **Crear nuevo proyecto:**
   - Haz clic en el selector de proyectos (arriba a la izquierda)
   - Selecciona "Nuevo proyecto"
   - **Nombre:** `EventPro-Calendar` (o el que prefieras)
   - Haz clic en "Crear"
   - ⚠️ **Asegúrate de seleccionar el proyecto recién creado**

### 2. Habilitar Google Calendar API

1. **Acceder a la biblioteca de APIs:**
   - En el menú lateral: "APIs y servicios" → "Biblioteca"
   - O directamente: https://console.cloud.google.com/apis/library

2. **Buscar y habilitar:**
   - Busca "Google Calendar API"
   - Haz clic en "Google Calendar API"
   - Presiona "HABILITAR"

### 3. Configurar Pantalla de Consentimiento OAuth

1. **Ir a pantalla de consentimiento:**
   - "APIs y servicios" → "Pantalla de consentimiento de OAuth"
   - O directamente: https://console.cloud.google.com/apis/credentials/consent

2. **Configurar información básica:**
   - **Tipo de usuario:** Externo
   - **Nombre de la aplicación:** EventPro
   - **Email de soporte del usuario:** tu-email@gmail.com
   - **Logotipo de la aplicación:** (opcional)
   - **Dominios de aplicación:**
     - Dominio de la aplicación: `localhost` (desarrollo) o tu dominio real
     - Política de privacidad: (opcional para desarrollo)
     - Condiciones del servicio: (opcional para desarrollo)
   - **Email de contacto del desarrollador:** tu-email@gmail.com

3. **Agregar alcances (scopes):**
   - Haz clic en "AGREGAR O QUITAR ALCANCES"
   - Busca y selecciona:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Haz clic en "ACTUALIZAR"

4. **Usuarios de prueba (solo para desarrollo):**
   - Agrega tu email y el de otros usuarios que probarán la aplicación
   - Haz clic en "AGREGAR USUARIOS"

5. **Guardar y continuar** hasta completar la configuración

### 4. Crear Credenciales OAuth 2.0

1. **Ir a Credenciales:**
   - "APIs y servicios" → "Credenciales"
   - O directamente: https://console.cloud.google.com/apis/credentials

2. **Crear ID de cliente OAuth 2.0:**
   - Haz clic en "+ CREAR CREDENCIALES"
   - Selecciona "ID de cliente de OAuth 2.0"

3. **Configurar aplicación web:**
   - **Tipo de aplicación:** Aplicación web
   - **Nombre:** EventPro Web Client

4. **URIs de origen autorizados:**
   Para **desarrollo local**:

   ```
   http://localhost:3000
   http://127.0.0.1:3000
   http://localhost:5173
   ```

   Para **producción**:

   ```
   https://tu-dominio.com
   https://www.tu-dominio.com
   ```

5. **URIs de redirección autorizados:**
   Para **desarrollo**:

   ```
   http://localhost:3000
   http://127.0.0.1:3000
   ```

   Para **producción**:

   ```
   https://tu-dominio.com
   ```

6. **Crear credenciales**

### 5. Obtener y Configurar las Credenciales

1. **Copiar credenciales:**
   - **ID de cliente:** Algo como `123456789-abcdefg.apps.googleusercontent.com`
   - **Secreto de cliente:** (No necesario para aplicaciones web públicas)

2. **Configurar en tu proyecto:**
   - Abre el archivo: `js/config/googleCalendar.js`
   - Reemplaza `TU_CLIENT_ID_AQUI.apps.googleusercontent.com` con tu Client ID real:

```javascript
export const GOOGLE_CALENDAR_CONFIG = {
  CLIENT_ID: '123456789-abcdefg.apps.googleusercontent.com', // ← Tu Client ID aquí
  SCOPES: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  DISCOVERY_URL:
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
};
```

### 6. Configurar URLs de Producción

1. **Para Netlify:**
   - Cambia las URLs en `googleCalendar.js`:

   ```javascript
   export const REDIRECT_URIS = {
     development: 'http://localhost:3000',
     production: 'https://tu-app.netlify.app', // ← Tu URL de Netlify aquí
   };
   ```

2. **Agregar URLs en Google Console:**
   - Ve nuevamente a las credenciales en Google Cloud Console
   - Edita tu ID de cliente OAuth 2.0
   - Agrega las URLs de producción a los "URIs de origen autorizados"

### 7. Probar la Integración

1. **Desarrollo local:**

   ```bash
   npm run dev
   # o
   python -m http.server 3000
   ```

2. **Crear un evento:**
   - Ve a "Crear Evento"
   - Deberías ver la sección "Sincronización con Google Calendar"
   - Haz clic en "Conectar"
   - Autoriza la aplicación
   - Crea un evento con la casilla marcada
   - ¡Verifica que aparezca en tu Google Calendar!

## 🔧 Solución de Problemas

### Error: "redirect_uri_mismatch"

- **Causa:** La URL desde donde accedes no está en los "URIs de origen autorizados"
- **Solución:** Agregar la URL exacta a las credenciales OAuth en Google Cloud Console

### Error: "unauthorized_client"

- **Causa:** El Client ID no es correcto o la aplicación no está configurada correctamente
- **Solución:** Verificar que el Client ID en `googleCalendar.js` sea correcto

### Error: "access_denied"

- **Causa:** El usuario no autorizó los permisos o hay problemas con los scopes
- **Solución:** Verificar que los scopes estén configurados correctamente en la pantalla de consentimiento

### La aplicación pide muchos permisos

- **Causa:** La aplicación no está verificada por Google
- **Solución:** Para desarrollo, continúa con "Avanzado" → "Ir a EventPro (no seguro)"

### Los eventos no se sincronizan

1. Verificar que el usuario esté conectado (indicador verde)
2. Verificar la consola del navegador para errores
3. Confirmar que la casilla de sincronización esté marcada

## 📝 Notas Importantes

- **Desarrollo:** Google permite hasta 100 usuarios de prueba
- **Producción:** Necesitarás verificar la aplicación con Google para usuarios ilimitados
- **Límites de API:** Google Calendar API tiene límites de uso (generalmente suficientes para uso normal)
- **Privacidad:** Los datos se sincronizan directamente entre tu aplicación y Google Calendar del usuario

## 🔐 Seguridad

- El Client ID es público y puede estar visible en el código frontend
- Los tokens de acceso se manejan automáticamente por la biblioteca de Google
- Los datos nunca pasan por tu servidor (comunicación directa navegador ↔ Google)

## 📞 Soporte

Si tienes problemas:

1. Verifica cada paso de esta guía
2. Revisa la consola del navegador para errores específicos
3. Consulta la documentación oficial de Google Calendar API: https://developers.google.com/calendar/api

¡Listo! Una vez configurado, todos los eventos de EventPro se pueden sincronizar automáticamente con Google Calendar. 🎉
