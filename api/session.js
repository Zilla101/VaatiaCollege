export default async function handler(req, res) {
    // This is a Vercel serverless function to mock session data for the live demo
    // In a full production app, this would query a database (Redis/MongoDB)

    const { method } = req;

    if (method === 'GET') {
        // Return a mock active session for the regular admin to show the SuperAdmin console working
        return res.status(200).json({
            success: true,
            users: [
                {
                    username: 'VaatiaAdmin',
                    role: 'Admin',
                    ip: '192.168.1.5',
                    lastSeen: new Date().toLocaleTimeString()
                }
            ]
        });
    }

    if (method === 'POST') {
        const { username, targetUser } = req.body;

        // Handle Heartbeat
        if (username) {
            return res.status(200).json({ success: true });
        }

        // Handle Terminate
        if (targetUser) {
            return res.status(200).json({
                success: true,
                message: `${targetUser} session flagged for termination (Mock)`
            });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
