

  export type Expense = {
    categoryId: number;
    amount: number;
    date: string;
    isDeleted: boolean;
  };

  export type Budget = {
    categoryId: number;
    yearlyAmount: number;
  };
  
  export type FiscalYearRange = {
    start: Date;
    end: Date;
  };

  // 年度計算
  export function getFiscalYearRange(
    baseDate: Date,
    fiscalStartMonth: number // 1〜12
  ) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth() + 1;
  
    const startYear = month >= fiscalStartMonth ? year : year - 1;
  
    const start = new Date(startYear, fiscalStartMonth - 1, 1);
    const end = new Date(startYear + 1, fiscalStartMonth - 1, 0);
  
    return { start, end };
  }

  // 年残金の計算
  export function getYearlyRemaining(
    budget: Budget,
    expenses: Expense[],
    baseDate: Date,
    fiscalStartMonth: number
  ): number {
    const range = getFiscalYearRange(baseDate, fiscalStartMonth);
  
    const used = getYearlyExpenseTotal(
      expenses,
      budget.categoryId,
      range
    );
  
    return budget.yearlyAmount - used;
  }

  // 月残金の計算
  export function getMonthlyRemaining(
    budget: Budget,
    expenses: Expense[],
    baseDate: Date,
    fiscalStartMonth: number
  ): number {
    const yearlyRemaining = getYearlyRemaining(
      budget,
      expenses,
      baseDate,
      fiscalStartMonth
    );
  
    const remainingMonths = getRemainingMonths(
      baseDate,
      fiscalStartMonth
    );
  
    return Math.floor(yearlyRemaining / remainingMonths);
  }

  // 日残金の計算
  export function getDailyRemaining(
    budget: Budget,
    expenses: Expense[],
    baseDate: Date,
    fiscalStartMonth: number
  ): number {
    const monthlyRemaining = getMonthlyRemaining(
      budget,
      expenses,
      baseDate,
      fiscalStartMonth
    );
  
    const remainingDays = getRemainingDays(baseDate);
  
    return Math.floor(monthlyRemaining / remainingDays);
  }

  // 何ヶ月目かを計算する
  export function getRemainingMonths(
    baseDate: Date,
    fiscalStartMonth: number
  ): number {
    const month = baseDate.getMonth() + 1;
  
    let remaining =
      fiscalStartMonth <= month
        ? 12 - (month - fiscalStartMonth)
        : fiscalStartMonth - month;
  
    return remaining === 0 ? 1 : remaining;
  } 

  // 残日数計算
  export function getRemainingDays(baseDate: Date): number {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
  
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = baseDate.getDate();
  
    const remaining = lastDay - today + 1;
    return remaining <= 0 ? 1 : remaining;
  } 

  // 年度内支出合計（カテゴリ別）
  function getYearlyExpenseTotal(
    expenses: Expense[],
    categoryId: number,
    range: { start: Date; end: Date }
  ): number {
    return expenses
      .filter((e) => !e.isDeleted)
      .filter((e) => e.categoryId === categoryId)
      .filter((e) => {
        const d = new Date(e.date);
        return d >= range.start && d <= range.end;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }