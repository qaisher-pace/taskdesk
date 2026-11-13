import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { users, publicUser } from '../data/seed.js';
import { loginSchema } from '../schemas.js';
import { parse } from '../middleware/validate.js';
import { signToken, requireToken } from '../middleware/auth.js';
import { HttpError } from '../errors.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'Invalid email or password');
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get('/me', requireToken, (req, res) => {
  res.json(publicUser(req.user));
});
