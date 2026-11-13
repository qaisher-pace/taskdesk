import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { delay } from './middleware/delay.js';
import { simulateErrors } from './middleware/simulateErrors.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { ticketsRouter } from './routes/tickets.js';
import { usersRouter } from './routes/users.js';

export const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());
app.use(delay);
app.use(simulateErrors);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/tickets', authenticate, ticketsRouter);
app.use('/users', authenticate, usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);
