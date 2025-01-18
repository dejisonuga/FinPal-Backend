import express from "express";
import { body } from "express-validator";
import { protect } from "../middlewares/authMiddleware.js";

import {
	login,
	forgotPassword,
	// resetPassword,
} from "../controllers/loginController.js";
import {
	createNewBudget,
	updateBudget,
	deleteBudget,
} from "../controllers/budgetController.js";
import { balance } from "../models/transactionModel.js";
import {
	getUsers,
	updateUsers,
	findUser,
	deleteUser,
	register,
} from "../controllers/usersController.js";
import { sendResetPasswordEmail } from "../services/emailTransporter.js";
import { resetPasswordToken } from "../controllers/tokenController.js";

const router = express.Router();

// Validation middleware
const registerValidation = [
	body("fullName")
		.trim()
		.isLength({ min: 3, max: 30 })
		.withMessage("Full name must be between 3 and 30 characters"),
	body("email").isEmail().withMessage("Please provide a valid email"),
	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters long"),
];

const loginValidation = [
	body("fullName")
		.trim()
		.isLength({ min: 3, max: 30 })
		.withMessage("Full name must be between 3 and 30 characters"),
	body("password").notEmpty().withMessage("Password is required"),
];

const passwordValidation = [
	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters long"),
];

const changePasswordValidation = [
	body("newPassword")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters long"),
	body("currentPassword")
		.notEmpty()
		.withMessage("Please enter your current password"),
];

export const incomeValidation = [
	// Validate 'titleOfBudget'
	body("titleOfBudget")
		.trim()
		.isLength({ min: 3, max: 30 })
		.withMessage("Budget title must be Income")
		.equals("Income"),

	// Validate 'category' array
	body("category")
		.isArray({ min: 1 })
		.withMessage("Category must be an array with at least one item")
		.custom((categories) => {
			// Validate each category item
			for (const category of categories) {
				if (!category.name || typeof category.name !== "string") {
					throw new Error("Each category must have a valid 'name' (string)");
				}
				if (
					!category.amount ||
					typeof category.amount !== "number" ||
					category.amount < 0
				) {
					throw new Error(
						"Each category must have a valid 'amount' (number, >= 0)"
					);
				}
			}
			return true; // Pass validation
		}),

	// Validate 'contents'
	body("contents")
		.isNumeric()
		.withMessage("Contents must be a valid number")
		.custom((value) => value >= 0)
		.withMessage("Contents cannot be negative"),
];

export const expenseValidation = [
	// Validate 'titleOfBudget'
	body("titleOfBudget")
		.trim()
		.isLength({ min: 3, max: 30 })
		.withMessage("Budget title must be Expense")
		.equals("Expense"),

	// Validate 'category' array
	body("category")
		.isArray({ min: 1 })
		.withMessage("Category must be an array with at least one item")
		.custom((categories) => {
			// Validate each category item
			for (const category of categories) {
				if (!category.name || typeof category.name !== "string") {
					throw new Error("Each category must have a valid 'name' (string)");
				}
				if (
					!category.amount ||
					typeof category.amount !== "number" ||
					category.amount < 0
				) {
					throw new Error(
						"Each category must have a valid 'amount' (number, >= 0)"
					);
				}
			}
			return true; // Pass validation
		}),

	// Validate 'contents'
	body("contents")
		.isNumeric()
		.withMessage("Contents must be a valid number")
		.custom((value) => value >= 0)
		.withMessage("Contents cannot be negative"),
];
// Login user endpoint
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginValidation, login);

// Forgot password endpoint
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent
 *       404:
 *         description: User not found
 */
router.post(
	"/forgot-password",
	passwordValidation,
	sendResetPasswordEmail,
	forgotPassword
);

// Reset password endpoint
/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post(
	"/reset-password",
	passwordValidation,
	resetPasswordToken
	// resetPassword
);

// Test user endpoint
/**
 * @swagger
 * /auth/test-auth:
 *   get:
 *     summary: Test protected route
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Not authorized
 */
router.get("/test-auth", protect, (req, res) => {
	res.json({
		status: "success",
		message: "You are authenticated",
		user: req.user,
	});
});

// Create users endpoint
router.post("/create-users", loginValidation, register);
// Register endpoint
router.post("/register", registerValidation, register);
// Find users endpoint
router.get("/get-users", loginValidation, getUsers);
// Find user endpoint
router.get("/find-user", loginValidation, findUser);
// Delete user endpoint
router.delete("/delete-user", loginValidation, deleteUser);
// Update user endpoint
router.put("/update-user", loginValidation, updateUsers);

// Create new budget endpoint
/*
 * @swagger
 * /auth/create-budget:
 *   post:
 *     summary: Create a new budget
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Income Budget created successfully, Expense Budget created successfully
 *       400:
 *         description: Validation error
 */
router.post(
	"/create-budget",
	incomeValidation,
	expenseValidation,
	createNewBudget
);

// Update budget endpoint
/*
 * @swagger
 * /auth/update-budget:
 *   post:
 *     summary: Update existing budget
 *     tags: [Authentication]
 *     requestParams:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Income Budget updated successfully, Expense Budget updated successfully
 *       400:
 *         description: Validation error
 */
router.put("/update-budget", protect, updateBudget);

// Delete budget endpoint
/*
 * @swagger
 * /auth/delete-budget:
 *   post:
 *     summary: Delete existing budget
 *     tags: [Authentication]
 *     requestParams:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Income Budget deleted successfully, Expense Budget deleted successfully
 *       400:
 *         description: Validation error
 */
router.delete("/delete-budget", protect, deleteBudget);

// Register user endpoint
/*
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */

// About us endpoint
router.get("/", (req, res) => {
	res.json({
		status: "success",
		message: "About Us",
		description: "Express.js application business",
	});
});

export default router;
