import { config } from '../config.js';
import { HttpError } from '../errors.js';

const FAILURE_RATE = 0.05;

export function simulateErrors(req, res, next) {
  const isGet = req.method === 'GET';
  const isPatch = req.method === 'PATCH';
  if (!isGet && !isPatch) return next();

  const forced = req.query.forceError === 'true';
  const flaky =
    config.simulateErrors &&
    ((isGet && req.path === '/tickets') || (isPatch && /^\/tickets\/\d+$/.test(req.path))) &&
    Math.random() < FAILURE_RATE;

  if (forced || flaky) return next(new HttpError(500, 'Simulated server error'));
  next();
}
