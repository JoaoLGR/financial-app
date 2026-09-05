import { describe, expect, it } from 'vitest';
import { resolveInvoiceForPurchase } from './cards';

describe('credit card invoice dates', () => {
  it('keeps purchases on or before closing in the current reference month', () => {
    expect(resolveInvoiceForPurchase('2026-09-03', 3, 10)).toEqual({
      referenceMonth: '2026-09-01',
      closingDate: '2026-09-03',
      dueDate: '2026-09-10',
    });
  });

  it('moves purchases after closing to the next reference month', () => {
    expect(resolveInvoiceForPurchase('2026-09-04', 3, 10)).toEqual({
      referenceMonth: '2026-10-01',
      closingDate: '2026-10-03',
      dueDate: '2026-10-10',
    });
  });
});
