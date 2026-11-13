import { config } from '../config.js';

// Random 300-800 ms delay on every route except POST /auth/login.
export function delay(req, res, next) {
  if (!config.simulateLatency || req.path === '/auth/login') return next();
  setTimeout(next, 300 + Math.floor(Math.random() * 501));
}
