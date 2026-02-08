const https = require('https');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            console.error('SENDGRID_API_KEY is not set');
            return { statusCode: 500, body: 'Email service unconfigured. Please add SENDGRID_API_KEY to Netlify environment variables.' };
        }

        const data = JSON.parse(event.body);
        const { user, device, resolution, time, url } = data;
        const ip = event.headers['x-nf-client-connection-ip'] || 'Unknown';

        const postData = JSON.stringify({
            personalizations: [{
                to: [
                    { email: 'adima.darellmax@gmail.com' },
                    { email: 'info@vaatiacollege.com.ng' }
                ],
                subject: '🚨 ADMIN PORTAL ACCESS ALERT: Vaatia College'
            }],
            from: { email: 'noreply@vaatiacollege.com.ng', name: 'Vaatia Security Engine' },
            content: [{
                type: 'text/plain',
                value: `
SECURITY ALERT: ADMIN PORTAL ACCESSED

The Vaatia College Admin Portal has just been accessed.

DETAILS:
- User: ${user}
- Time: ${time}
- IP Address: ${ip}
- Device context: ${device}
- Screen Resolution: ${resolution}
- Access Point: ${url}

If this was not an authorized access, please investigate immediately.
                `
            }]
        });

        const options = {
            hostname: 'api.sendgrid.com',
            port: 443,
            path: '/v3/mail/send',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let chunks = '';
                res.on('data', (chunk) => chunks += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            statusCode: 200,
                            body: JSON.stringify({ success: true, message: 'Security alert dispatched.' })
                        });
                    } else {
                        console.error('SendGrid error:', chunks);
                        resolve({ statusCode: res.statusCode, body: 'Failed to send email via SendGrid' });
                    }
                });
            });

            req.on('error', (e) => {
                console.error('Request error:', e);
                resolve({ statusCode: 500, body: 'Internal Error during email dispatch' });
            });

            req.write(postData);
            req.end();
        });

    } catch (err) {
        console.error('Function error:', err);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
