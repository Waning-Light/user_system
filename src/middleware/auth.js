const pool = require('../db');

function extractSessionId(req) {
    const fromHeader = req.get('X-Session-Id');
    if (fromHeader && fromHeader.trim()) return fromHeader.trim();

    const auth = req.get('Authorization');
    if (auth) {
        const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
        if (m) return m[1].trim();
    }
    return '';
}

async function requireAuth(req, res, next) {
    try {
        const sessionId = extractSessionId(req);
        if (!sessionId) {
            return res.status(401).json({ message: 'unauthorized' });
        }

        const [rows] = await pool.execute(
            'SELECT user_id FROM sessions WHERE session_id = ? LIMIT 1',
            [sessionId]
        );
        if (rows.length === 0) {
            return res.status(401).json({ message: 'unauthorized' });
        }

        req.userId = rows[0].user_id;
        req.sessionId = sessionId;
        next();
    } catch (e) {
        next(e);
    }
}

module.exports = { requireAuth };