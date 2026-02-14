// Mock Session Data (In-memory for Vercel demo)
let mockUsers = [
    {
        username: 'VaatiaAdmin',
        role: 'Admin',
        ip: '192.168.1.5',
        lastSeen: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        lastAction: 'Reviewing Pages'
    }
];

let mockActions = [
    { username: 'VaatiaAdmin', action: 'Accessed Page Manager', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
];

export default async function handler(req, res) {
    const { method } = req;

    if (method === 'GET') {
        return res.status(200).json({
            success: true,
            users: mockUsers || [],
            actions: (mockActions || []).slice(-15).reverse() // Show last 15 actions
        });
    }

    if (method === 'POST') {
        const { username, targetUser, action, timestamp, role } = req.body;

        // Handle Heartbeat
        if (username && !action) {
            const userIdx = mockUsers.findIndex(u => u.username === username);
            if (userIdx > -1) {
                mockUsers[userIdx].timestamp = timestamp || new Date().toISOString();
                mockUsers[userIdx].lastSeen = new Date().toLocaleTimeString();
            } else {
                mockUsers.push({
                    username,
                    role: role || 'Admin',
                    ip: 'REMOTE_IP',
                    lastSeen: new Date().toLocaleTimeString(),
                    timestamp: timestamp || new Date().toISOString()
                });
            }
            return res.status(200).json({ success: true });
        }

        // Handle Action Log
        if (username && action) {
            mockActions.push({ username, action, timestamp: timestamp || new Date().toISOString() });
            const userIdx = mockUsers.findIndex(u => u.username === username);
            if (userIdx > -1) mockUsers[userIdx].lastAction = action;
            return res.status(200).json({ success: true });
        }

        // Handle Terminate
        if (targetUser) {
            mockUsers = mockUsers.filter(u => u.username !== targetUser);
            mockActions.push({ username: 'SYSTEM', action: `Terminated ${targetUser} session`, timestamp: new Date().toISOString() });
            return res.status(200).json({ success: true });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
