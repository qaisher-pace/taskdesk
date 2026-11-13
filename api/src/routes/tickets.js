import { Router } from 'express';
import { tickets, comments, findTicket, newTicketId } from '../data/seed.js';
import { listTicketsQuery, createTicketSchema, updateTicketSchema } from '../schemas.js';
import { parse } from '../middleware/validate.js';
import { requireRole } from '../middleware/auth.js';
import { notFound, forbidden } from '../errors.js';
import { commentsRouter } from './comments.js';

export const ticketsRouter = Router();

const PRIORITY_RANK = { low: 1, medium: 2, high: 3, urgent: 4 };

const SORTERS = {
  createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  // tickets without a due date always sort last
  dueDate: (a, b) => {
    if (a.dueDate === b.dueDate) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  },
};

// Resolves :id to req.ticket or throws 404.
export function loadTicket(req, res, next) {
  const id = Number(req.params.id);
  const ticket = Number.isInteger(id) ? findTicket(id) : undefined;
  if (!ticket) return next(notFound('Ticket'));
  req.ticket = ticket;
  next();
}

ticketsRouter.get('/', (req, res) => {
  const { status, priority, assigneeId, q, page, limit, sort } = parse(listTicketsQuery, req.query);
  const needle = q?.toLowerCase();

  const filtered = tickets.filter(
    (t) =>
      (!status || status.includes(t.status)) &&
      (!priority || priority.includes(t.priority)) &&
      (assigneeId === undefined ||
        (assigneeId === 'unassigned' ? t.assigneeId === null : t.assigneeId === assigneeId)) &&
      (!needle ||
        t.title.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle)),
  );

  const desc = sort.startsWith('-');
  const sorter = SORTERS[desc ? sort.slice(1) : sort];
  const sorted = [...filtered].sort((a, b) => {
    const cmp = sorter(a, b);
    // keep "no due date" last even when sorting descending
    if (sort.endsWith('dueDate') && (a.dueDate === null || b.dueDate === null)) return cmp;
    return desc ? -cmp : cmp;
  });

  const total = sorted.length;
  const start = (page - 1) * limit;
  res.json({
    data: sorted.slice(start, start + limit),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

ticketsRouter.post('/', (req, res) => {
  const body = parse(createTicketSchema, req.body);
  const now = new Date().toISOString();
  const ticket = {
    id: newTicketId(),
    title: body.title,
    description: body.description,
    status: 'open',
    priority: body.priority,
    assigneeId: body.assigneeId ?? null,
    reporterId: req.user.id,
    dueDate: body.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
  };
  tickets.push(ticket);
  res.status(201).json(ticket);
});

ticketsRouter.get('/:id', loadTicket, (req, res) => {
  res.json(req.ticket);
});

ticketsRouter.patch('/:id', loadTicket, (req, res) => {
  if (req.user.role !== 'admin' && req.body && 'assigneeId' in req.body) throw forbidden();
  const changes = parse(updateTicketSchema, req.body);
  Object.assign(req.ticket, changes, { updatedAt: new Date().toISOString() });
  res.json(req.ticket);
});

ticketsRouter.delete('/:id', requireRole('admin'), loadTicket, (req, res) => {
  tickets.splice(tickets.indexOf(req.ticket), 1);
  for (let i = comments.length - 1; i >= 0; i--) {
    if (comments[i].ticketId === req.ticket.id) comments.splice(i, 1);
  }
  res.status(204).end();
});

ticketsRouter.use('/:id/comments', loadTicket, commentsRouter);
