const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APPS_SCRIPT_HOST = 'script.google.com';

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const firstName = typeof request.body?.firstName === 'string' ? request.body.firstName.trim() : '';
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const honeypot = typeof request.body?.company === 'string' ? request.body.company.trim() : '';

  if (honeypot) return response.status(200).json({ success: true });
  if (!firstName) return response.status(400).json({ error: 'First name is required.' });
  if (!email) return response.status(400).json({ error: 'Email address is required.' });
  if (firstName.length > 80) return response.status(400).json({ error: 'First name is too long.' });
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return response.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const scriptSecret = process.env.APPS_SCRIPT_SECRET;

  if (!scriptUrl || !scriptSecret) {
    return response.status(500).json({ error: 'The waitlist is not configured yet.' });
  }

  try {
    const destination = new URL(scriptUrl);
    if (destination.protocol !== 'https:' || destination.hostname !== APPS_SCRIPT_HOST || !destination.pathname.endsWith('/exec')) {
      throw new Error('Invalid Apps Script URL');
    }

    const scriptResponse = await fetch(destination, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ firstName, email, secret: scriptSecret }),
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (!scriptResponse.ok) throw new Error(`Apps Script returned ${scriptResponse.status}`);

    const result = JSON.parse(await scriptResponse.text());
    if (!result.success) throw new Error(result.error || 'Apps Script rejected the submission');

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Waitlist submission failed:', error?.code || error?.message || 'Unknown error');
    return response.status(500).json({ error: 'We couldn’t add you right now. Please try again.' });
  }
};
