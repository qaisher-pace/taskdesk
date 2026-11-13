const flag = (value, fallback) =>
  value === undefined ? fallback : value === 'true';

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  requireAuth: flag(process.env.REQUIRE_AUTH, false),
  simulateLatency: flag(process.env.SIMULATE_LATENCY, true),
  simulateErrors: flag(process.env.SIMULATE_ERRORS, true),
  corsOrigin: 'http://localhost:5173',
};
