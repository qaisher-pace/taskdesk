import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { findUser } from '../data/seed.js';
import { unauthorized, forbidden } from '../errors.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

// Returns the user for a valid bearer token, null if no token, throws 401 if invalid.
function userFromRequest(req) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ['HS256'] });
    const user = findUser(Number(payload.sub));
    if (!user) throw unauthorized();
    return user;
  } catch {
    throw unauthorized();
  }
}

// Respects REQUIRE_AUTH: falls back to user 1 when auth is off and no token is sent.
export function authenticate(req, res, next) {
  const user = userFromRequest(req);
  if (user) req.user = user;
  else if (config.requireAuth) return next(unauthorized());
  else req.user = findUser(1);
  next();
}

// Always needs a valid token (used by GET /auth/me).
export function requireToken(req, res, next) {
  const user = userFromRequest(req);
  if (!user) return next(unauthorized());
  req.user = user;
  next();
}

export const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : next(forbidden());
