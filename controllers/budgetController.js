import { Expense, Income } from "../models/budgetModel.js";
import { balance } from "../models/transactionModel.js";

//-------Budget Handling------------------
// Create new budget

export const createNewBudget = async (req, res) => {
	const { titleOfBudget, author, category, comments } = req.body;

	try {
		// Validate budget type
		if (!["Income", "Expense"].includes(titleOfBudget)) {
			return res
				.status(400)
				.json({ error: "Invalid budget type. Must be 'Income' or 'Expense'." });
		}

		if (!author || typeof author !== "string") {
			return res.status(400).json({ error: "Author must be a valid string." });
		}

		// Additional validation for category and total
		if (!Array.isArray(category) || category.length === 0) {
			return res
				.status(400)
				.json({ error: "Category must be a non-empty array." });
		}

		// Determine the model based on the budget type
		const isIncome = titleOfBudget === "Income";
		const Model = isIncome ? Income : Expense;

		// Create and save the new record
		const newRecord = new Model({
			titleOfBudget,
			author,
			category,
			comments,
		});
		await newRecord.save();

		// Fetch the updated balance
		const { totalIncome, totalExpense, netBalance } = await balance();

		// Respond with success
		return res.status(201).json({
			message: `${titleOfBudget} Budget created successfully`,
			totalIncome,
			totalExpense,
			netBalance,
		});
	} catch (error) {
		console.error("Error creating budget:", error.message);

		// Handle specific Mongoose validation errors
		if (error.name === "ValidationError") {
			const validationErrors = Object.values(error.errors).map(
				(err) => err.message
			);
			return res
				.status(400)
				.json({ error: "Validation Error", details: validationErrors });
		}

		// General server error
		return res
			.status(500)
			.json({ error: `Error creating budget: ${error.message}` });
	}
};

// Update Budget
export const updateBudget = async (req, res, next) => {
	const { oldContents, oldCategory, newContents, newCategory } = req.body;
	try {
		const incomeUpdate = await Income.updateOne(
			{ contents: oldContents, category: oldCategory },
			{ $set: { contents: newContents, category: newCategory } }
		);

		const expenseUpdate = await Expense.updateOne(
			{ contents: oldContents, category: oldCategory },
			{ $set: { contents: newContents, category: newCategory } }
		);

		res.status(200).json({
			message: "Budget updated",
			incomeUpdate,
			expenseUpdate,
		});
	} catch (error) {
		console.error("Error updating budget:", error);
		res.status(500).json({ error: "Error updating budget" });
	}
};

// Delete Budget
export const deleteBudget = async (req, res, next) => {
	const { titleOfBudget, author } = req.params;

	if (titleOfBudget === "Income") {
		const incomeDeleted = await Income.deleteOne({ titleOfBudget, author });
		return res
			.status(200)
			.json({ message: "Income Budget deleted", data: incomeDeleted });
	}

	if (titleOfBudget === "Expense") {
		const expenseDeleted = await Expense.deleteOne({ titleOfBudget, author });
		return res
			.status(200)
			.json({ message: "Expense Budget deleted", data: expenseDeleted });
	}

	res
		.status(400)
		.json({ error: "Invalid budget type. Must be 'Income' or 'Expense'." });
};
