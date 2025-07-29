// Netlify Function: send-whatsapp.js
// Place this file in /netlify/functions/

export default async (req, res) => {
  // Enable CORS
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Missing phone or message' });
  }

  // Read CallMeBot config from environment variables
  const apiKey = process.env.VITE_CALLMEBOT_API_KEY;
  const baseUrl = process.env.VITE_CALLMEBOT_BASE_URL;

  // Build CallMeBot URL
  const url = `${baseUrl}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));
    const response = await fetch(url, { method: 'GET' });
    const result = await response.text();
    if (response.ok && result.includes('sent')) {
      return res.status(200).json({ success: true, result });
    } else {
      return res.status(500).json({ success: false, error: result });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
