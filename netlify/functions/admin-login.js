const https = require('https');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { user, device, resolution, time, url } = data;
        const ip = event.headers['x-nf-client-connection-ip'] || 'Unknown';

        const emailContent = `
🚨 ADMIN PORTAL ACCESS ALERT

The Vaatia College Admin Portal has just been accessed.

DETAILS:
- User: ${user}
- Time: ${time}
- IP Address: ${ip}
- Device: ${device}
- Resolution: ${resolution}
- Access Point: ${url}

If this was not you, please rotate the admin credentials immediately.
        `;

        console.log('--- SECURITY ALERT LOGGED ---');
        console.log(emailContent);

        // Note: To send actual emails, you would integrate SendGrid/Mailgun here.
        // For now, we log it to Netlify internal logs for security auditing.

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Security alert dispatched.' })
        };
    } catch (err) {
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
