const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatCurrency(valueInReais: number) { return currency.format(valueInReais); }
export function toCents(valueInReais: number) { return Math.round(valueInReais * 100); }
export function fromCents(valueInCents: number) { return valueInCents / 100; }
export function parseCurrencyInput(value: string) { const normalized = value.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.'); const parsed = Number(normalized); return Number.isFinite(parsed) ? parsed : null; }
