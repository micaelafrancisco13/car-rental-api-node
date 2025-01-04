const joi = require("joi")
const jwt = require("jsonwebtoken")

function generateAuthToken(user) {
	return jwt.sign(
		{
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			phoneNumber: user.phoneNumber,
			role: user.role,
		},
		process.env.JWT_PRIVATE_KEY,
	)
}

function getJoiSchema() {
	return joi.object({
		firstName: joi.string().min(2).max(255).required().label("First name"),
		lastName: joi.string().min(2).max(255).required().label("Last name"),
		email: joi
			.string()
			.email({ tlds: { allow: true } })
			.min(2)
			.max(255)
			.required()
			.label("Email address"),
		phoneNumber: joi
			.string()
			.regex(/^(09|\+639)\d{9}$/)
			.required()
			.messages({
				"string.pattern.base":
					"Phone number must be a valid Philippine number (e.g., 09123456789 or +639123456789)",
			}),
		password: joi.string().min(8).max(50).required().label("Password"),
		role: joi.string().valid("CUSTOMER", "EMPLOYEE", "IT_ADMIN").required().label("Role"),
		// booker: joi.when("role", {
		// 	is: "CUSTOMER",
		// 	then: joi.object({
		// 		userId: joi.string().uuid().required(), // Assuming userId is required for Booker
		// 	}),
		// 	otherwise: joi.forbidden(),
		// }),
		// driver: joi.when("role", {
		// 	is: "CUSTOMER",
		// 	then: joi.object({
		// 		// Driver details if the role is CUSTOMER
		// 	}),
		// 	otherwise: joi.forbidden(),
		// }),
	})
}

function validateUser(user) {
	return getJoiSchema().validate(user)
}

exports.validateUser = validateUser
exports.generateUserAuthToken = generateAuthToken
