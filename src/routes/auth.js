const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { isValidUsername, isValidPassword, wrap, toIso } = require('../utils');

const router = express.Router();

router.post('/register', wrap(async (req, res) => {
    const { username, password } = req.body ?? {};

    if (!isValidUsername(username) || !isValidPassword(password)) {
        return res.status(400).json({ message: 'invalid request body' });
    }

    const id = crypto.randomUUID();
    try {
        await pool.execute(
            'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
            [id, username, password]
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'username already exists' });
        }
        throw err;
    }

    const [rows] = await pool.execute(
        'SELECT id, username, created_at FROM users WHERE id = ?', [id]
    );
    const u = rows[0];
    res.status(201).json({
        id: u.id,
        username: u.username,
        createdAt: toIso(u.created_at),
    });
}));

router.post('/login', wrap(async (req, res) => {
    const { username, password } = req.body ?? {};

    if (typeof username !== 'string' || typeof password !== 'string'
        || !username || !password) {
        return res.status(400).json({ message: 'invalid request body' });
    }

    const [rows] = await pool.execute(
        'SELECT id, username, password FROM users WHERE username = ? LIMIT 1',
        [username]
    );

    if (rows.length === 0 || rows[0].password !== password) {
        return res.status(401).json({ message: 'invalid username or password' });
    }

    const user = rows[0];
    const sessionId = crypto.randomBytes(32).toString('hex');

    await pool.execute(
        'INSERT INTO sessions (session_id, user_id) VALUES (?, ?)',
        [sessionId, user.id]
    );

    res.status(200).json({
        accessToken: sessionId,
        tokenType: 'Bearer',
        user: { id: user.id, username: user.username },
    });
}));

module.exports = router;