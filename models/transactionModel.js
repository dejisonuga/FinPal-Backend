import { Expense, Income } from "./budgetModel.js";

//--- Transactions Workouts (for calculating balance)
export const balance = async () => {
	try {
		// Fetch income and expense records concurrently
		const [incomeRecords, expenseRecords] = await Promise.all([
			Income.find(),
			Expense.find(),
		]);

		// Helper function to calculate total
		const calculateTotal = (items) =>
			items.reduce((sum, item) => sum + (Number(item.contents) || 0), 0);

		// Calculate totals
		const totalIncome = calculateTotal(incomeRecords);
		const totalExpense = calculateTotal(expenseRecords);
		const netBalance = totalIncome - totalExpense;

		// Return the calculated values
		return {
			totalIncome,
			totalExpense,
			netBalance,
		};
	} catch (error) {
		console.error("Error calculating balance:", error);

		// Return a fallback structure in case of error
		return {
			totalIncome: 0,
			totalExpense: 0,
			netBalance: 0,
			error: error.message,
		};
	}
};
