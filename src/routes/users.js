const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { isValidUsername, isValidPassword, wrap, toIso } = require('../utils');

const router = express.Router();
router.use(requireAuth);

router.get('/me', wrap(async (req, res) => {
    const [rows] = await pool.execute(
        'SELECT id, username, created_at FROM users WHERE id = ?', [req.userId]
    );
    if (rows.length === 0) {
        return res.status(401).json({ message: 'unauthorized' });
    }
    const u = rows[0];
    res.json({ id: u.id, username: u.username, createdAt: toIso(u.created_at) });
}));

router.get('/', wrap(async (req, res) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const pageSize = req.query.pageSize === undefined ? 20 : Number(req.query.pageSize);

    if (!Number.isInteger(page) || page < 1
        || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
        return res.status(400).json({ message: 'invalid pagination parameters' });
    }

    const offset = (page - 1) * pageSize;
    const [items] = await pool.query(
        `SELECT id, username FROM users ORDER BY created_at ASC, id ASC LIMIT ${pageSize} OFFSET ${offset}`
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');

    res.json({ items, page, pageSize, total: Number(total) });
}));

router.patch('/me/username', wrap(async (req, res) => {
    const { username } = req.body ?? {};

    if (!isValidUsername(username)) {
        return res.status(400).json({ message: 'invalid request body' });
    }

    try {
        await pool.execute('UPDATE users SET username = ? WHERE id = ?',
            [username, req.userId]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'username already exists' });
        }
        throw err;
    }

    const [rows] = await pool.execute(
        'SELECT id, username FROM users WHERE id = ?', [req.userId]
    );
    res.json(rows[0]);
}));

router.patch('/me/password', wrap(async (req, res) => {
    const { oldPassword, newPassword } = req.body ?? {};

    if (typeof oldPassword !== 'string' || !oldPassword || !isValidPassword(newPassword)) {
        return res.status(400).json({ message: 'invalid request body' });
    }

    const [rows] = await pool.execute(
        'SELECT password FROM users WHERE id = ?', [req.userId]
    );
    if (rows.length === 0) {
        return res.status(401).json({ message: 'unauthorized' });
    }
    if (rows[0].password !== oldPassword) {
        return res.status(400).json({ message: 'old password is incorrect' });
    }

    await pool.execute('UPDATE users SET password = ? WHERE id = ?',
        [newPassword, req.userId]);

    res.json({ message: 'password updated' });
}));

router.delete('/me', wrap(async (req, res) => {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.userId]);
    res.status(204).end();
}));

module.exports = router;