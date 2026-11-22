require('dotenv').config();
const express = require('express');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);

app.use((req, res) => res.status(404).json({ message: 'not found' }));

app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'invalid request body' });
    }
    if (err && err.type === 'entity.too.large') {
        return res.status(400).json({ message: 'invalid request body' });
    }
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(500).json({ message: 'internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));