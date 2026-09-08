export type Transaction = { id: string; type: "income" | "expense"; amount: number; category: string; description: string | null; transaction_date: string; source: string | null; work_schedule_id?: string | null };
export type Budget = { id: string; category: string; amount: number; month: number; year: number };
export const EXPENSE_CATEGORIES = ["Food", "Transportation", "Education", "Shopping", "Entertainment", "Bills", "Other"];
export const INCOME_CATEGORIES = ["Part-time", "Scholarship", "Allowance", "Other"];
export const thb = (amount: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(amount || 0);
export const monthBounds = (date = new Date()) => ({ start: new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10), end: new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().slice(0, 10) });
export function financeSummary(transactions: Transaction[]) { const income = transactions.filter(x => x.type === "income").reduce((s,x) => s + Number(x.amount), 0); const expense = transactions.filter(x => x.type === "expense").reduce((s,x) => s + Number(x.amount), 0); return { income, expense, balance: income - expense, partTime: transactions.filter(x => x.source === "work_schedule").reduce((s,x) => s + Number(x.amount), 0) }; }
export function budgetSpent(transactions: Transaction[], category: string) { return transactions.filter(x => x.type === "expense" && x.category === category).reduce((s,x) => s + Number(x.amount), 0); }
