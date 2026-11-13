import { Router } from 'express';
import { users } from '../data/seed.js';

export const usersRouter = Router();

usersRouter.get('/', (req, res) => {
  res.json(users.map(({ id, name, role }) => ({ id, name, role })));
});
