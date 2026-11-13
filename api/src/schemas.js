import { z } from 'zod';
import { findUser } from './data/seed.js';

export const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const SORTS = ['createdAt', '-createdAt', 'priority', '-priority', 'dueDate', '-dueDate'];

const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Must be a valid date')
  .transform((s) => new Date(s).toISOString());

const assigneeId = z
  .number()
  .int()
  .refine((id) => Boolean(findUser(id)), 'Assignee must be an existing user');

// "open,in_progress" or ?status=open&status=closed -> ['open', 'in_progress']
const csvEnum = (values) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v),
    z.array(z.enum(values)).min(1),
  );

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, 'Password is required'),
});

export const listTicketsQuery = z.object({
  status: csvEnum(STATUSES).optional(),
  priority: csvEnum(PRIORITIES).optional(),
  assigneeId: z.union([z.literal('unassigned'), z.coerce.number().int().positive()]).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(SORTS).default('-createdAt'),
});

export const createTicketSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(2000),
  priority: z.enum(PRIORITIES),
  assigneeId: assigneeId.nullable().optional(),
  dueDate: isoDate.nullable().optional(),
});

export const updateTicketSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(1).max(2000),
    status: z.enum(STATUSES),
    priority: z.enum(PRIORITIES),
    assigneeId: assigneeId.nullable(),
    dueDate: isoDate.nullable(),
  })
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

export const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});
