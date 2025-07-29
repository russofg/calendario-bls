// Netlify Function: send-whatsapp.js
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const { phone, message } = body;
  if (!phone || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing phone or message' }),
    };
  }

  const apiKey = process.env.VITE_CALLMEBOT_API_KEY;
  const baseUrl = process.env.VITE_CALLMEBOT_BASE_URL;
  const url = `${baseUrl}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const result = await response.text();
    if (response.ok && (result.includes('sent') || result.includes('queued'))) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, result }),
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: result }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
