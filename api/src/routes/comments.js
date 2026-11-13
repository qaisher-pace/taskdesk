import { Router } from 'express';
import { comments, newCommentId } from '../data/seed.js';
import { createCommentSchema } from '../schemas.js';
import { parse } from '../middleware/validate.js';

// Mounted at /tickets/:id/comments; req.ticket is set by loadTicket.
export const commentsRouter = Router();

commentsRouter.get('/', (req, res) => {
  const list = comments
    .filter((c) => c.ticketId === req.ticket.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json(list);
});

commentsRouter.post('/', (req, res) => {
  const { text } = parse(createCommentSchema, req.body);
  const comment = {
    id: newCommentId(),
    ticketId: req.ticket.id,
    authorId: req.user.id,
    authorName: req.user.name,
    text,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  res.status(201).json(comment);
});
