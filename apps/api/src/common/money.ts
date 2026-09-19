import { Decimal } from '@prisma/client/runtime/library';

export interface Money {
  amount: Decimal;
  currency: string;
}

export function createMoney(amount: number, currency: string): Money {
  return {
    amount: new Decimal(amount),
    currency,
  };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error('Cannot add money in different currencies');
  }
  return {
    amount: a.amount.plus(b.amount),
    currency: a.currency,
  };
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error('Cannot subtract money in different currencies');
  }
  return {
    amount: a.amount.minus(b.amount),
    currency: a.currency,
  };
}

export function multiplyMoney(money: Money, factor: number): Money {
  return {
    amount: money.amount.times(factor),
    currency: money.currency,
  };
}

export function roundMoney(money: Money, roundingMode: 'HALF_UP' | 'HALF_DOWN' = 'HALF_UP'): Money {
  const rounded = money.amount.toDecimalPlaces(2, roundingMode === 'HALF_UP' ? 1 : 0);
  return {
    amount: rounded,
    currency: money.currency,
  };
}

export function moneyToNumber(money: Money): number {
  return money.amount.toNumber();
}
