const https = require('https');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const resendKey = process.env.RESEND_API_KEY;
        const sendGridKey = process.env.SENDGRID_API_KEY;
        const senderEmail = process.env.SENDGRID_SENDER || 'adima.darellmax@gmail.com';

        if (!resendKey && !sendGridKey) {
            console.error('No Email API Key set');
            return { statusCode: 500, body: 'Email service unconfigured. Please add RESEND_API_KEY or SENDGRID_API_KEY to Netlify.' };
        }

        const data = JSON.parse(event.body);
        const { user, device, resolution, time, url } = data;
        const ip = event.headers['x-nf-client-connection-ip'] || 'Unknown';

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
                const req = https.request(resendOptions, (res) => {
                    let chunks = '';
                    res.on('data', (c) => chunks += c);
                    res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
                });
                req.on('error', (e) => resolve({ status: 500, body: e.message }));
                req.write(resendData);
                req.end();
            });

            if (resendRes.status >= 200 && resendRes.status < 300) {
                return { statusCode: 200, body: JSON.stringify({ success: true, provider: 'Resend' }) };
            }
            console.error('Resend Failed:', resendRes.body);
            // Fallthrough to SendGrid if Resend fails but SendGrid is set
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

            return new Promise((resolve) => {
                const req = https.request(sgOptions, (res) => {
                    let chunks = '';
                    res.on('data', (chunk) => chunks += chunk);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({
                                statusCode: 200,
                                body: JSON.stringify({ success: true, message: 'Security alert dispatched via SendGrid.' })
                            });
                        } else {
                            // CRITICAL: Log exact SendGrid error for the user to debug verification issues
                            console.error(`--- SENDGRID ERROR [${res.statusCode}] ---`);
                            console.error('Response Body:', chunks);
                            console.error('HINT: Check if noreply@vaatiacollege.com.ng is a Verified Sender in your SendGrid dashboard.');

                            resolve({
                                statusCode: res.statusCode,
                                body: JSON.stringify({
                                    success: false,
                                    error: 'Email delivery failed via SendGrid',
                                    details: chunks
                                })
                            });
                        }
                    });
                });

                req.on('error', (e) => {
                    console.error('SendGrid Request error:', e);
                    resolve({ statusCode: 500, body: 'Internal Error during SendGrid email dispatch' });
                });

                req.write(sgData);
                req.end();
            });
        }

        return { statusCode: 500, body: 'All email providers failed or unconfigured.' };

    } catch (err) {
        console.error('Function error:', err);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
