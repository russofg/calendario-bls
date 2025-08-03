const https = require('https');

exports.handler = async (event, context) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { action, eventData, accessToken } = JSON.parse(event.body);

    if (!accessToken) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Access token is required' })
      };
    }

    let apiPath, method, postData = null;

    switch (action) {
      case 'create':
        apiPath = '/calendar/v3/calendars/primary/events';
        method = 'POST';
        postData = JSON.stringify({
          summary: eventData.title,
          description: eventData.description,
          start: {
            dateTime: eventData.startTime,
            timeZone: 'America/Argentina/Buenos_Aires'
          },
          end: {
            dateTime: eventData.endTime,
            timeZone: 'America/Argentina/Buenos_Aires'
          },
          location: eventData.location
        });
        break;
      
      case 'update':
        apiPath = `/calendar/v3/calendars/primary/events/${eventData.googleEventId}`;
        method = 'PUT';
        postData = JSON.stringify({
          summary: eventData.title,
          description: eventData.description,
          start: {
            dateTime: eventData.startTime,
            timeZone: 'America/Argentina/Buenos_Aires'
          },
          end: {
            dateTime: eventData.endTime,
            timeZone: 'America/Argentina/Buenos_Aires'
          },
          location: eventData.location
        });
        break;
      
      case 'delete':
        apiPath = `/calendar/v3/calendars/primary/events/${eventData.googleEventId}`;
        method = 'DELETE';
        break;
        
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

    // Realizar llamada a Google Calendar API
    const calendarResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.googleapis.com',
        port: 443,
        path: apiPath,
        method: method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (postData) {
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });

    if (calendarResponse.statusCode >= 400) {
      console.error('Calendar API failed:', calendarResponse.data);
      return {
        statusCode: calendarResponse.statusCode,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Calendar API request failed',
          details: calendarResponse.data
        })
      };
    }

    // Respuesta exitosa
    const responseData = calendarResponse.data ? JSON.parse(calendarResponse.data) : { success: true };
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Error in calendar operation:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
