import { z } from 'zod';

export const moneySchema = z.number().finite().positive();
export const transactionSchema = z.object({ description: z.string().trim().min(1).max(140), amount: moneySchema, type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']), transactionDate: z.coerce.date(), competenceDate: z.coerce.date(), paymentMethod: z.enum(['PIX', 'DEBIT', 'CASH', 'CREDIT_CARD']).optional() });
export const accountSchema = z.object({ name: z.string().trim().min(1).max(80), type: z.string().min(1), initialBalance: z.number().finite() });
export const creditCardSchema = z.object({ name: z.string().trim().min(1), brand: z.string().trim().max(40).optional(), limitAmount: z.coerce.number().nonnegative(), closingDay: z.coerce.number().int().min(1).max(31), dueDay: z.coerce.number().int().min(1).max(31) });
export const fuelEntrySchema = z.object({ vehicleId: z.string().uuid(), fuelType: z.enum(['GASOLINE', 'ETHANOL', 'DIESEL', 'GNV']), fuelDate: z.coerce.date(), odometer: z.number().nonnegative(), liters: moneySchema, totalAmount: moneySchema, fullTank: z.boolean() });
