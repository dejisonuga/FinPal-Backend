import mongoose from "mongoose";
import { balance } from "./transactionModel.js";

// Remark/Comment Schema
const remarkSchema = new mongoose.Schema({
  body: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

// Base Budget Schema
const baseBudgetSchema = {
  titleOfBudget: { type: String, required: true },
  author: { type: String, required: true },
};

// Shared Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
});

const transactionSchema = new mongoose.Schema(
  {
    contents: [{ type: mongoose.Schema.Types.ObjectId, refPath: "contentType" }],
    contentType: { type: String, required: true, enum: ["Income", "Expense"] },
    total: { type: Number, required: false, min: [0, "Total cannot be negative"] },
    remarks: [remarkSchema],
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Pre-save middleware for transactions
transactionSchema.pre("save", async function (next) {
  try {
    const { netBalance } = await balance();
    this.comments.push({
      body: `Net balance at the time of transaction: ${netBalance}`,
      date: new Date(),
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Expense Schema
const expenseSchema = new mongoose.Schema(
  {
    ...baseBudgetSchema,
    category: [categorySchema],
    total: [transactionSchema],
  },
  { timestamps: true }
);

expenseSchema.pre("save", async function (next) {
  try {
    if (this.category.some(cat => cat.amount == null)) {
      return next(new Error("All categories must have a valid amount."));
    }
    this.total = this.category.reduce((sum, cat) => sum + (cat.amount || 0), 0);
    next();
  } catch (error) {
    next(error);
  }
});

// Income Schema
const incomeSchema = new mongoose.Schema(
  {
    ...baseBudgetSchema,
    category: [categorySchema],
    total: [transactionSchema],
    comments: [remarkSchema],
  },
  { timestamps: true }
);

incomeSchema.pre("save", async function (next) {
  try {
    if (this.category.some(cat => cat.amount == null)) {
      return next(new Error("All categories must have a valid amount."));
    }
    this.total = this.category.reduce((sum, cat) => sum + (cat.amount || 0), 0);
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes
expenseSchema.index({ titleOfBudget: 1, author: 1, date: -1 });
incomeSchema.index({ titleOfBudget: 1, author: 1, date: -1 });

// Models
const Expense = mongoose.model("Expense", expenseSchema);
const Income = mongoose.model("Income", incomeSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

export { Expense, Income, Transaction };
