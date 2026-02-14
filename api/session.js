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

// Global Access State (Ephemeral for Vercel)
let adminAccessBlocked = false;

let mockActions = [
    { username: 'VaatiaAdmin', action: 'Accessed Page Manager', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
];

export default async function handler(req, res) {
    const { method } = req;

    if (method === 'GET') {
        return res.status(200).json({
            success: true,
            users: mockUsers || [],
            actions: (mockActions || []).slice(-15).reverse(), // Show last 15 actions
            adminAccessBlocked // Export the flag
        });
    }

    if (method === 'POST') {
        const { username, targetUser, action, timestamp, role, toggleAccess } = req.body;
        const now = Date.now();

        // 0. Handle Admin Access Toggle (Super Admin only call)
        if (toggleAccess !== undefined) {
            adminAccessBlocked = toggleAccess;
            mockActions.push({
                username: 'SYSTEM',
                action: `${toggleAccess ? 'DENIED' : 'RESTORED'} access for regular admins`,
                timestamp: new Date().toISOString()
            });
            return res.status(200).json({ success: true, adminAccessBlocked });
        }

        // 1. Handle Terminate Protocol
        if (targetUser) {
            mockUsers = mockUsers.filter(u => u.username.toLowerCase() !== targetUser.toLowerCase());
            mockActions.push({
                username: 'SYSTEM',
                action: `Terminated ${targetUser} session`,
                timestamp: new Date().toISOString()
            });
            return res.status(200).json({ success: true });
        }

        // 2. Handle Heartbeat & Identity tracking
        if (username) {
            // Block regular admins if flag is active
            const userRole = (role || '').trim() || 'Admin';
            if (adminAccessBlocked && !userRole.includes('Super')) {
                return res.status(403).json({ success: false, blocked: true, message: 'ADMIN ACCESS TEMPORARILY SUSPENDED' });
            }

            const existingIndex = mockUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
            const currentLoginTime = req.body.loginTime || new Date().toLocaleTimeString();

            if (existingIndex > -1) {
                mockUsers[existingIndex] = {
                    ...mockUsers[existingIndex],
                    role: userRole,
                    loginTime: mockUsers[existingIndex].loginTime || currentLoginTime,
                    lastEdit: req.body.lastEdit || mockUsers[existingIndex].lastEdit || 'Monitoring',
                    lastSeen: new Date().toLocaleTimeString(),
                    timestamp: now,
                    lastAction: action || mockUsers[existingIndex].lastAction || 'Active'
                };
            } else {
                mockUsers.push({
                    username,
                    role: userRole,
                    loginTime: currentLoginTime,
                    lastEdit: req.body.lastEdit || 'Session Initialized',
                    ip: req.headers['x-forwarded-for'] || 'SERVER',
                    lastSeen: new Date().toLocaleTimeString(),
                    timestamp: now,
                    lastAction: action || 'Session Initialized'
                });
            }

            // 3. Handle Action Log Record
            if (action) {
                mockActions.push({
                    username,
                    action,
                    timestamp: new Date().toISOString()
                });
            }

            // 4. Cleanup stale sessions (Threshold: 5 mins)
            const STALE_THRESHOLD = 5 * 60 * 1000;
            mockUsers = mockUsers.filter(u => (now - u.timestamp) < STALE_THRESHOLD);

            return res.status(200).json({ success: true });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
