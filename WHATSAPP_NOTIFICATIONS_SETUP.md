# 📱 Sistema de Notificaciones WhatsApp - EventPro

## 🎯 Descripción

Sistema completo de notificaciones por WhatsApp usando la API de CallMeBot para enviar notificaciones automáticas a todos los usuarios registrados cuando:

- ✅ Se crea un evento nuevo
- ✅ Se modifica un evento existente
- ✅ Se elimina un evento
- ✅ Se acerca la fecha del evento (48h y 24h antes)

## 🔧 Configuración Inicial

### 1. Obtener API Key de CallMeBot

1. **Registrarse en CallMeBot:**
   - Ve a https://www.callmebot.com/
   - Crea una cuenta gratuita

2. **Obtener API Key:**
   - Ve a https://www.callmebot.com/blog/free-api-whatsapp-messages/
   - Sigue las instrucciones para obtener tu API key

3. **Configurar la API Key:**
   - Abre `js/config/constants.js`
   - Reemplaza `YOUR_CALLMEBOT_API_KEY_HERE` con tu API key real

```javascript
export const WHATSAPP_CONFIG = {
  API_KEY: 'TU_API_KEY_AQUI', // ← Reemplazar aquí
  // ... resto de configuración
};
```

### 2. Configurar Números de Teléfono

Los usuarios deben tener números de teléfono válidos en su perfil. El sistema valida automáticamente:

- ✅ Números argentinos (10 dígitos)
- ✅ Con código de país (+54)
- ✅ Formato correcto para WhatsApp

**Formatos válidos:**

- `01112345678` → Se convierte a `541112345678`
- `+54 11 1234-5678` → Se convierte a `541112345678`
- `5491112345678` → Se mantiene como `5491112345678`

## 📋 Funcionalidades

### 1. Notificaciones de Eventos

#### 🎉 Evento Creado

```
🎉 NUEVO EVENTO CREADO

*Nombre del Evento*
📍 Lugar: Ubicación del evento
🏢 Productora: Nombre de la productora
📞 Contacto: Información de contacto
📅 Fecha: Fecha formateada

¡Revisa los detalles en la aplicación!
```

#### ✏️ Evento Actualizado

```
✏️ EVENTO ACTUALIZADO

*Nombre del Evento*
📍 Lugar: Ubicación del evento
🏢 Productora: Nombre de la productora
📞 Contacto: Información de contacto
📅 Fecha: Fecha formateada

¡Revisa los cambios en la aplicación!
```

#### 🗑️ Evento Eliminado

```
🗑️ EVENTO ELIMINADO

*Nombre del Evento*
📅 Fecha: Fecha formateada

El evento ha sido eliminado.
```

### 2. Recordatorios Automáticos

#### ⏰ Recordatorio 48h

```
⏰ RECORDATORIO - 48 HORAS

*Nombre del Evento*
📍 Lugar: Ubicación del evento
🏢 Productora: Nombre de la productora
📞 Contacto: Información de contacto
📅 Fecha: Fecha formateada
⏰ Hora: Hora del evento

¡El evento está a 48 horas!
```

#### 🚨 Recordatorio 24h

```
🚨 RECORDATORIO - 24 HORAS

*Nombre del Evento*
📍 Lugar: Ubicación del evento
🏢 Productora: Nombre de la productora
📞 Contacto: Información de contacto
📅 Fecha: Fecha formateada
⏰ Hora: Hora del evento

¡El evento es mañana!
```

## 🔄 Flujo de Funcionamiento

### 1. Creación de Evento

1. Usuario crea evento
2. Se guarda en Firebase
3. Se envía notificación a todos los usuarios
4. Se programa recordatorio automático

### 2. Actualización de Evento

1. Usuario modifica evento
2. Se actualiza en Firebase
3. Se envía notificación a todos los usuarios
4. Se reprograma recordatorio si cambió la fecha

### 3. Eliminación de Evento

1. Usuario elimina evento
2. Se elimina de Firebase
3. Se envía notificación a todos los usuarios
4. Se cancelan recordatorios programados

### 4. Recordatorios Automáticos

1. Servicio verifica cada 30 minutos
2. Busca eventos con recordatorios pendientes
3. Envía notificaciones 48h y 24h antes
4. Marca recordatorios como enviados

## 🧪 Pruebas

### 1. Probar Validación de Teléfono

```javascript
// En la consola del navegador
import('./js/utils/phoneValidator.js').then(({ PhoneValidator }) => {
  // Probar números válidos
  console.log(PhoneValidator.validatePhone('01112345678'));
  console.log(PhoneValidator.validatePhone('+54 11 1234-5678'));

  // Probar números inválidos
  console.log(PhoneValidator.validatePhone('123'));
  console.log(PhoneValidator.validatePhone(''));
});
```

### 2. Probar Envío de Notificación

```javascript
// En la consola del navegador
import('./js/modules/whatsappNotificationManager.js').then(
  ({ WhatsAppNotificationManager }) => {
    const manager = new WhatsAppNotificationManager(db);

    // Probar envío a un número específico
    manager.sendWhatsAppMessage('01112345678', 'Prueba de notificación');
  }
);
```

### 3. Probar Recordatorios

```javascript
// En la consola del navegador
import('./js/modules/reminderService.js').then(({ ReminderService }) => {
  const service = new ReminderService(db);

  // Iniciar servicio
  service.start(1); // Verificar cada minuto para pruebas

  // Verificar estado
  console.log(service.getStatus());
});
```

## 📊 Monitoreo

### Logs del Sistema

El sistema genera logs detallados para monitoreo:

```
📱 Sending WhatsApp message to: 541112345678
✅ WhatsApp message sent successfully to: 541112345678
📊 WhatsApp notification results: 5 sent, 0 failed
📅 Event reminders scheduled for: Evento de Prueba
⏰ Checking for due reminders...
```

### Métricas

- **Notificaciones enviadas:** Contador de mensajes exitosos
- **Notificaciones fallidas:** Contador de errores
- **Usuarios con teléfonos válidos:** Número de usuarios que pueden recibir notificaciones
- **Recordatorios programados:** Eventos con recordatorios activos

## 🔧 Configuración Avanzada

### 1. Personalizar Mensajes

Edita las plantillas en `js/config/constants.js`:

```javascript
MESSAGE_TEMPLATES: {
  EVENT_CREATED: 'Tu mensaje personalizado aquí...',
  // ... otros templates
}
```

### 2. Cambiar Intervalo de Verificación

```javascript
// En el código de inicialización
reminderService.start(15); // Verificar cada 15 minutos
```

### 3. Configurar Zona Horaria

```javascript
TIMEZONE: 'America/Argentina/Buenos_Aires', // Cambiar si es necesario
```

## 🚨 Solución de Problemas

### Error: "Invalid phone number"

- Verificar que el número tenga formato argentino válido
- Asegurar que el usuario tenga número en su perfil

### Error: "API key invalid"

- Verificar que la API key sea correcta
- Confirmar que la cuenta de CallMeBot esté activa

### Error: "No users with valid phone numbers"

- Verificar que los usuarios tengan números de teléfono
- Comprobar que los números pasen la validación

### Recordatorios no se envían

- Verificar que el servicio de recordatorios esté activo
- Comprobar que los eventos tengan fechas futuras
- Revisar logs para errores específicos

## 📝 Archivos del Sistema

- `js/config/constants.js` - Configuración y plantillas
- `js/utils/phoneValidator.js` - Validación de teléfonos
- `js/modules/whatsappNotificationManager.js` - Gestor de notificaciones
- `js/modules/eventManager.js` - Integración con eventos
- `js/modules/reminderService.js` - Servicio de recordatorios
- `js/modules/uiManager.js` - Validación en formulario de perfil

## 🎯 Beneficios

- ✅ **Notificaciones automáticas** para todos los usuarios
- ✅ **Recordatorios inteligentes** 48h y 24h antes
- ✅ **Validación robusta** de números de teléfono
- ✅ **Zona horaria argentina** configurada
- ✅ **Logs detallados** para monitoreo
- ✅ **Fácil configuración** con API key
- ✅ **Mensajes personalizables** con plantillas
- ✅ **Manejo de errores** robusto

---

**Estado:** ✅ Implementado y Listo para Usar
**Fecha:** Diciembre 2024
**Versión:** 1.0
