const USERNAME_RE = /^[A-Za-z0-9_]{3,32}$/;
const PWD_MIN = 6, PWD_MAX = 128;

const isValidUsername = (v) => typeof v === 'string' && USERNAME_RE.test(v);
const isValidPassword = (v) => typeof v === 'string' && v.length >= PWD_MIN && v.length <= PWD_MAX;

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toIso = (d) => (d ? new Date(d).toISOString() : null);

module.exports = { USERNAME_RE, isValidUsername, isValidPassword, wrap, toIso };