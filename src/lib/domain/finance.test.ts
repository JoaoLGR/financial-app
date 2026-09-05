import { describe, expect, it } from 'vitest';
import { calculateAccountBalance, calculateFuelEfficiency, calculatePricePerLiter } from './finance';

describe('finance domain', () => {
  it('calculates a balance using only settled movements', () => {
    expect(calculateAccountBalance(100, [
      { type: 'INCOME', amount: 50, status: 'RECEIVED' },
      { type: 'EXPENSE', amount: 20, status: 'PAID' },
      { type: 'EXPENSE', amount: 999, status: 'PENDING' },
    ])).toBe(130);
  });

  it('applies transfer direction without counting it as income or expense', () => {
    expect(calculateAccountBalance(1000, [
      { type: 'TRANSFER', amount: 250, status: 'PAID', transfer_direction: 'OUT' },
      { type: 'TRANSFER', amount: 75, status: 'RECEIVED', transfer_direction: 'IN' },
    ])).toBe(825);
  });

  it('calculates fuel price and efficiency', () => {
    expect(calculatePricePerLiter(146.72, 34.2)).toBeCloseTo(4.2901, 4);
    const efficiency = calculateFuelEfficiency(81980, 82450, 34.2, 146.72);
    expect(efficiency?.distance).toBe(470);
    expect(efficiency?.kilometersPerLiter).toBeCloseTo(13.7427, 4);
    expect(efficiency?.costPerKilometer).toBeCloseTo(0.3122, 4);
  });

  it('rejects invalid fuel quantities', () => {
    expect(() => calculatePricePerLiter(10, 0)).toThrow('Liters must be greater than zero');
    expect(calculateFuelEfficiency(100, 90, 10)).toBeNull();
  });
});
