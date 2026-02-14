// Session Data (In-memory for Vercel — ephemeral per instance)
let mockUsers = [];

// Global Access State
let adminAccessBlocked = false;

let mockActions = [];

export default async function handler(req, res) {
    // 🛡️ Enhanced CORS Handler
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { method } = req;
    const now = Date.now();

    // GET: Return full state snapshot (used by Super Admin radar + regular admin access check)
    if (method === 'GET') {
        return res.status(200).json({
            success: true,
            users: mockUsers.map(u => ({ ...u, isActive: (now - u.timestamp) < 90000 })),
            actions: (mockActions || []).slice(-15).reverse(),
            adminAccessBlocked
        });
    }

    if (method === 'POST') {
        const { username, targetUser, action, role, toggleAccess, device } = req.body;

        // 0. Handle Admin Access Toggle (Super Admin only)
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
            const userRole = (role || '').trim() || 'Admin';

            // Block regular admins if flag is active
            if (adminAccessBlocked && !userRole.includes('Super')) {
                return res.status(403).json({
                    success: false,
                    blocked: true,
                    adminAccessBlocked: true,
                    message: 'ACCESS RESTRICTED BY SUPER ADMIN'
                });
            }

            const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown';
            const existingIndex = mockUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
            const currentLoginTime = req.body.loginTime || new Date().toLocaleTimeString();

            // Parse device string into something readable
            const rawDevice = device || req.headers['user-agent'] || 'Unknown Device';
            const deviceShort = parseDevice(rawDevice);

            if (existingIndex > -1) {
                mockUsers[existingIndex] = {
                    ...mockUsers[existingIndex],
                    role: userRole,
                    loginTime: mockUsers[existingIndex].loginTime || currentLoginTime,
                    lastEdit: req.body.lastEdit || mockUsers[existingIndex].lastEdit || 'Monitoring',
                    device: deviceShort,
                    ip: clientIP,
                    lastSeen: new Date().toLocaleTimeString(),
                    timestamp: now,
                    lastAction: action || mockUsers[existingIndex].lastAction || 'Active'
                };
            } else {
                mockUsers.push({
                    username,
                    role: userRole,
                    loginTime: currentLoginTime,
                    lastEdit: req.body.lastEdit || 'Session Started',
                    device: deviceShort,
                    ip: clientIP,
                    lastSeen: new Date().toLocaleTimeString(),
                    timestamp: now,
                    lastAction: action || 'Login'
                });
            }

            // Action Log
            if (action) {
                mockActions.push({
                    username,
                    action,
                    timestamp: new Date().toISOString()
                });
            }

            // Cleanup stale sessions (10 min threshold for better Vercel persistence)
            const STALE_THRESHOLD = 10 * 60 * 1000;
            mockUsers = mockUsers.filter(u => (now - u.timestamp) < STALE_THRESHOLD);

            return res.status(200).json({
                success: true,
                adminAccessBlocked,
                users: mockUsers.map(u => ({ ...u, isActive: (now - u.timestamp) < 90000 }))
            });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}

// Parse user-agent into friendly device name
function parseDevice(ua) {
    let browser = 'Browser';
    let os = 'Device';

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';

    return `${browser} / ${os}`;
}
