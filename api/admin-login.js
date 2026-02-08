const https = require('https');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const resendKey = process.env.RESEND_API_KEY;
        const sendGridKey = process.env.SENDGRID_API_KEY;
        const senderEmail = process.env.SENDGRID_SENDER || 'adima.darellmax@gmail.com';

        if (!resendKey && !sendGridKey) {
            console.error('No Email API Key set');
            return res.status(500).json({ message: 'Email service unconfigured. Please add RESEND_API_KEY or SENDGRID_API_KEY to Vercel Environment Variables.' });
        }

        const { user, device, resolution, time, url } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';

        const emailSubject = '🚨 ADMIN PORTAL ACCESS ALERT: Vaatia College';
        const emailBody = `
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
        `;

        // 1. TRY RESEND (If configured)
        if (resendKey) {
            const resendData = JSON.stringify({
                from: `Vaatia Security <${process.env.RESEND_SENDER || 'onboarding@resend.dev'}>`,
                to: ['adima.darellmax@gmail.com', 'info@vaatiacollege.com.ng'],
                subject: emailSubject,
                text: emailBody
            });

            const resendOptions = {
                hostname: 'api.resend.com',
                port: 443,
                path: '/emails',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(resendData)
                }
            };

            const resendRes = await new Promise((resolve) => {
                const request = https.request(resendOptions, (response) => {
                    let chunks = '';
                    response.on('data', (c) => chunks += c);
                    response.on('end', () => resolve({ status: response.statusCode, body: chunks }));
                });
                request.on('error', (e) => resolve({ status: 500, body: e.message }));
                request.write(resendData);
                request.end();
            });

            if (resendRes.status >= 200 && resendRes.status < 300) {
                return res.status(200).json({ success: true, provider: 'Resend' });
            }
            console.error('Resend Failed:', resendRes.body);
        }

        // 2. TRY SENDGRID
        if (sendGridKey) {
            const sgData = JSON.stringify({
                personalizations: [{
                    to: [{ email: 'adima.darellmax@gmail.com' }, { email: 'info@vaatiacollege.com.ng' }],
                    subject: emailSubject
                }],
                from: { email: senderEmail, name: 'Vaatia Security Engine' },
                content: [{ type: 'text/plain', value: emailBody }]
            });

            const sgOptions = {
                hostname: 'api.sendgrid.com',
                port: 443,
                path: '/v3/mail/send',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sendGridKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(sgData)
                }
            };

            const sgRes = await new Promise((resolve) => {
                const request = https.request(sgOptions, (response) => {
                    let chunks = '';
                    response.on('data', (chunk) => chunks += chunk);
                    response.on('end', () => resolve({ status: response.statusCode, body: chunks }));
                });
                request.on('error', (e) => resolve({ status: 500, body: e.message }));
                request.write(sgData);
                request.end();
            });

            if (sgRes.status >= 200 && sgRes.status < 300) {
                return res.status(200).json({ success: true, provider: 'SendGrid' });
            }
            console.error('SendGrid Failed:', sgRes.body);
        }

        return res.status(500).json({ message: 'All email providers failed or unconfigured.' });

    } catch (err) {
        console.error('Function error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
