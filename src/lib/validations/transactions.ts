import { z } from 'zod';

const base = { description: z.string().trim().min(1).max(140), amount: z.coerce.number().positive(), transactionDate: z.string().min(10), competenceDate: z.string().min(10), dueDate: z.string().optional(), notes: z.string().max(500).optional() };
export const incomeSchema = z.object({ ...base, categoryId: z.string().uuid(), accountId: z.string().uuid(), status: z.enum(['PENDING', 'RECEIVED', 'OVERDUE', 'CANCELLED']) });
export const expenseSchema = z.object({ ...base, categoryId: z.string().uuid(), accountId: z.string().uuid(), paymentMethod: z.enum(['PIX', 'DEBIT', 'CASH']), status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']) });
export const transferSchema = z.object({ description: z.string().trim().max(140).optional(), amount: z.coerce.number().positive(), transactionDate: z.string().min(10), sourceAccountId: z.string().uuid(), destinationAccountId: z.string().uuid() }).refine(value => value.sourceAccountId !== value.destinationAccountId, { message: 'As contas de origem e destino devem ser diferentes.' });
export const accountSchema = z.object({ name: z.string().trim().min(1).max(80), type: z.enum(['CHECKING', 'SAVINGS', 'DIGITAL', 'CASH', 'OTHER']), initialBalance: z.coerce.number().finite() });
export const categorySchema = z.object({ name: z.string().trim().min(1).max(80), type: z.enum(['INCOME', 'EXPENSE', 'BOTH']) });
