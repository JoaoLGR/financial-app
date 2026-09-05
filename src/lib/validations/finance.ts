import { z } from 'zod';

export const moneySchema = z.number().finite().positive();
export const transactionSchema = z.object({ description: z.string().trim().min(1).max(140), amount: moneySchema, type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']), transactionDate: z.coerce.date(), competenceDate: z.coerce.date(), paymentMethod: z.enum(['PIX', 'DEBIT', 'CASH', 'CREDIT_CARD']).optional() });
export const accountSchema = z.object({ name: z.string().trim().min(1).max(80), type: z.string().min(1), initialBalance: z.number().finite() });
export const creditCardSchema = z.object({ name: z.string().trim().min(1), brand: z.string().trim().max(40).optional(), limitAmount: z.coerce.number().nonnegative(), closingDay: z.coerce.number().int().min(1).max(31), dueDay: z.coerce.number().int().min(1).max(31) });
export const fuelEntrySchema = z.object({ vehicleId: z.string().uuid(), fuelType: z.enum(['GASOLINE', 'ETHANOL', 'DIESEL', 'GNV']), fuelDate: z.coerce.date(), odometer: z.coerce.number().nonnegative(), liters: z.coerce.number().positive(), totalAmount: z.coerce.number().positive(), fullTank: z.boolean() });
export const vehicleSchema = z.object({ name: z.string().trim().min(1).max(80), plate: z.string().trim().max(12).optional(), brand: z.string().trim().max(60).optional(), model: z.string().trim().min(1).max(80), year: z.coerce.number().int().min(1900).max(2200).optional(), odometer: z.coerce.number().nonnegative(), fuelTypes: z.array(z.enum(['GASOLINE', 'ETHANOL', 'DIESEL', 'GNV'])).min(1) });
